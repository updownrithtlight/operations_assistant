from .excel_template_generator import ExcelTemplateGenerator
from .payload_builder import PayloadBuilder
from .schema_parser import AlibabaSchemaParser
from .schema_service import AlibabaSchemaService
from .schema_filler import AlibabaSchemaFiller
from .schema_validator import SchemaValidator
from .schema_option_validator import SchemaOptionValidator
from .schema_field_mapper import SchemaFieldMapper
from .image_service import AlibabaImageService
from .video_service import AlibabaVideoService
import tempfile
import os

from ..price_integrity import ensure_price_integrity


class AlibabaProductFlow:
    """
    阿里国际站 ICBU 标准发品流程（无 SKU）

    当前版本特性：
    - 不处理 SKU / saleProp
    - 图片 / 视频支持上传 or 从素材银行随机兜底
    - 启用 required 校验 + option 校验
    """

    def __init__(self, token: str):
        self.token = token

    def publish_product(
            self,
            cat_id: int,
            product_input: dict,
            image_paths: list[str] | None = None,
            video_path: str | None = None,
    ):
        # =========================
        # 1. 图片处理（上传 or 随机兜底）
        # =========================
        image_urls: list[str] = []

        if image_paths:
            for path in image_paths:
                with open(path, "rb") as f:
                    res = AlibabaImageService.upload_image(
                        self.token,
                        file_name=path.split("/")[-1],
                        image_bytes=f.read(),
                    )
                image_urls.append(
                    res["upload_image_response"]["photobank_url"]
                )
        else:
            # 👉 兜底：从图片银行随机取 1 张
            bank_images = AlibabaImageService.list_images(self.token)
            if not bank_images:
                raise ValueError("❌ 图片库为空，且未提供 image_paths")
            image_urls.append(bank_images[0]["photobank_url"])

        product_input["images"] = image_urls

        # =========================
        # 2. 视频处理（可选 + 随机兜底）
        # =========================
        if video_path:
            video_res = AlibabaVideoService.upload(self.token, video_path)
            product_input["video"] = video_res.get("video_url")
        else:
            bank_videos = AlibabaVideoService.list_videos(self.token)
            if bank_videos:
                product_input["video"] = bank_videos[0].get("video_url")

        # =========================
        # 3. 获取 schema
        # =========================
        schema_xml = AlibabaSchemaService.get_schema(
            token=self.token,
            cat_id=cat_id,
        )
        schema_json = AlibabaSchemaParser.to_json(schema_xml)

        # =========================
        # 4. 字段映射（product_input → schema_data）
        # =========================
        schema_data = SchemaFieldMapper.map(product_input)

        # =========================
        # 5. 校验（核心防线）
        # =========================
        SchemaValidator.validate(schema_json, schema_data)
        SchemaOptionValidator.validate(schema_json, schema_data)

        # =========================
        # 6. 填充 XML
        # =========================
        final_xml = AlibabaSchemaFiller.fill(
            data=schema_data
        )

        # =========================
        # 7. 发布
        # =========================
        return AlibabaSchemaService.publish(
            token=self.token,
            xml=final_xml,
        )

    @staticmethod
    def publish_minimal_product(token: str):
        cat_id = 202220072

        schema_xml = AlibabaSchemaService.get_schema(token=token, cat_id=cat_id)
        schema_json = AlibabaSchemaParser.to_json(schema_xml)

        mapper = SchemaFieldMapper(schema_json)
        builder = PayloadBuilder(schema_json)

        # ========= 基础字段 =========
        flat_data = {}
        flat_data.update(mapper.map_row({
            "productTitle": "API Minimal Test Product",
            "scPrice": "1",  # 阶梯定价
            "minOrderQuantity": 1,  # MOQ（与 ladderPrice 对齐）
            "productDescType": "2",  # 普通编辑
            "saleType": "normal",
            "priceUnit": "4",  # Piece
            "superText": "<p>This is a minimal product published by API.</p>",
        }))

        # ========= 图片（必填） =========
        images = AlibabaImageService.list_images(token)
        image_list = (
            images.get("alibaba_icbu_photobank_list_response", {})
            .get("pagination_query_list", {})
            .get("list", {})
            .get("photobank_image_do", [])
        )

        if not image_list:
            raise RuntimeError("图片银行中没有图片")

        first_img = image_list[0]
        flat_data.update({
            "scImages.scImages_0": {
                "fileId": first_img["id"],
                "url": first_img["url"],
            }
        })

        # ========= 阶梯价（价格，必填） =========
        flat_data.update({
            "ladderPrice.ladderPrice_0.quantity": 1,
            "ladderPrice.ladderPrice_0.price": 100,
        })

        # ========= 交期（必填） =========
        flat_data.update({
            "ladderPeriod.ladderPeriod_0.quantity": 1,
            "ladderPeriod.ladderPeriod_0.day": 7,
        })

        # ========= ⭐ 价格完整性兜底（关键） =========
        ensure_price_integrity(flat_data)

        # ========= 物流（最稳：协商物流） =========
        flat_data.update({
            "shippingTemplate.templateType": "aliLogistics",
            "shippingTemplate.shippingTemplateId": "2061493154",
        })

        # ========= 构建并发布 =========
        payload = builder.build(flat_data)
        xml = AlibabaSchemaService.payload_to_xml(payload, schema_json)
        schema_xml_fields = AlibabaSchemaService.build_schema_xml_fields(flat_data)

        return AlibabaSchemaService.publish(
            token=token,
            xml=xml,
            schema_xml_fields=schema_xml_fields,
            cat_id=cat_id
        )

    @staticmethod
    def excel_template_generator(token: str):
        # =========================
        # 1. 类目（先写死，后面再自动）
        # =========================
        cat_id = 202220072  # TODO: 替换成真实类目 ID

        # =========================
        # 2. 获取 schema XML
        # =========================
        schema_xml = AlibabaSchemaService.get_schema(
            token=token,
            cat_id=cat_id
        )
        # =========================
        # 3. 解析 schema（用于调试 / 校验）
        # =========================
        schema_json = AlibabaSchemaParser.to_json(schema_xml)


        tmp_dir = tempfile.gettempdir()
        file_path = os.path.join(tmp_dir, "products_template.xlsx")

        gen = ExcelTemplateGenerator(schema_json)
        gen.generate(file_path)

        return file_path
