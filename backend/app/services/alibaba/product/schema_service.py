from backend.app.services.alibaba.alibaba_client import call_api
from backend.app.services.alibaba.utils.utils import stable_json
import xml.etree.ElementTree as ET


class AlibabaSchemaService:
    # =========================
    # schema.get
    # =========================
    @staticmethod
    def get_schema(
        token: str,
        cat_id: int,
        language: str = "en_US",
        publish_type: str = "default",
        version: str = "trade.1.1",
    ) -> str:
        resp = call_api(
            api_name="alibaba.icbu.product.schema.get",
            access_token=token,
            api_params={
                "param_product_top_publish_request": stable_json({
                    "cat_id": cat_id,
                    "language": language,
                    "publish_type": publish_type,
                    "version": version,
                })
            },
            http_method="POST",
        )

        key = "alibaba_icbu_product_schema_get_response"
        if key not in resp:
            raise RuntimeError(f"schema.get 返回异常结构: {resp}")

        inner = resp[key]
        if not inner.get("biz_success"):
            raise RuntimeError(f"schema.get 业务失败: {inner}")

        schema_xml = inner.get("data")
        if not schema_xml:
            raise RuntimeError("schema.get 返回 data 为空")

        return schema_xml

    # =========================
    # schema.add
    # =========================
    @staticmethod
    def publish(
        token: str,
        xml: str,
        schema_xml_fields: str,
        language: str = "en_US",
        publish_type: str = "default",
        cat_id: int = 1341,
        version: str = "trade.1.1",
    ):
        return call_api(
            api_name="alibaba.icbu.product.schema.add",
            access_token=token,
            api_params={
                "param_product_top_publish_request": stable_json({
                    "publish_type": publish_type,
                    "language": language,
                    "cat_id": cat_id,
                    "version": version,
                    "xml": xml,
                    "schemaXmlFields": schema_xml_fields,  # ⭐ 必须
                })
            },
            http_method="POST",
        )

    # =========================
    # payload → XML
    # =========================
    @staticmethod
    def payload_to_xml(payload: dict, schema_json: list[dict]) -> str:
        schema_index = SchemaIndex(schema_json)
        root = ET.Element("itemSchema")

        def build(parent, data: dict):
            for field_id, value in data.items():
                schema_field = schema_index.get(field_id)
                if not schema_field:
                    raise KeyError(f"Schema 中不存在字段: {field_id}")

                field_el = ET.SubElement(
                    parent,
                    "field",
                    {
                        "id": field_id,
                        "type": schema_field["type"],
                    }
                )

                # ===== 图片（必须 fileId）=====
                if field_id.startswith("scImages_") and isinstance(value, dict):
                    if "fileId" not in value:
                        raise ValueError("图片必须包含 fileId")

                    val_el = ET.SubElement(
                        field_el,
                        "value",
                        {
                            "fileId": str(value["fileId"]),
                            "fileFlag": "NO",
                        },
                    )
                    val_el.text = value.get("url", "")
                    continue

                # ===== complex =====
                if isinstance(value, dict):
                    complex_el = ET.SubElement(field_el, "complex-value")
                    build(complex_el, value)
                else:
                    ET.SubElement(field_el, "value").text = str(value)

        build(root, payload)
        return ET.tostring(root, encoding="unicode")

    # =========================
    # schemaXmlFields 生成
    # =========================
    @staticmethod
    def build_schema_xml_fields(flat_data: dict) -> str:
        """
        规则：
        - 取 flat_data 每个 key 的 root fieldId
        - 去重 + 排序
        """
        field_ids = {k.split(".", 1)[0] for k in flat_data.keys()}
        return ",".join(sorted(field_ids))


# =========================
# SchemaIndex
# =========================
class SchemaIndex:
    def __init__(self, schema_json: list[dict]):
        self.by_id = {}
        self._build(schema_json)

    def _build(self, fields: list[dict]):
        for f in fields:
            if f.get("id"):
                self.by_id[f["id"]] = f
            for c in f.get("children", []) or []:
                self._build([c])

    def get(self, field_id: str) -> dict | None:
        return self.by_id.get(field_id)
