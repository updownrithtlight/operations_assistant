from typing import Optional, Dict, Any

from backend.app.services.alibaba.alibaba_client import call_api


class AlibabaImageService:
    """
    ICBU 图片银行相关接口封装
    """

    # 1️⃣ 图片银行查询（photobank.list）
    @staticmethod
    def list_images(
        token: str,
        location_type: Optional[str] = None,
        page_size: int = 20,
        current_page: int = 1,
        group_id: Optional[str] = None,
        extra_context: Optional[Dict[str, Any]] = None,
    ):
        """
        国际站图片银行查询接口
        """
        return call_api(
            "alibaba.icbu.photobank.list",
            token,
            {
                "location_type": location_type,
                "page_size": page_size,
                "current_page": current_page,
                "group_id": group_id,
                "extra_context": extra_context,
            },
            http_method="POST",
        )

    # 2️⃣ 图片原始文件查询（rawimage.get）
    @staticmethod
    def get_raw_image(
        token: str,
        image_name: str,
    ):
        """
        图片原始文件查询接口（返回 base64）
        """
        return call_api(
            "alibaba.icbu.rawimage.get",
            token,
            {
                "image_name": image_name,
            },
            http_method="POST",
        )

    # 3️⃣ 图片银行分组列表（photobank.group.list）
    @staticmethod
    def list_groups(
        token: str,
        group_id: Optional[int] = None,
        extra_context: Optional[Dict[str, Any]] = None,
    ):
        """
        图片银行分组信息获取
        """
        return call_api(
            "alibaba.icbu.photobank.group.list",
            token,
            {
                "id": group_id,
                "extra_context": extra_context,
            },
            http_method="POST",
        )

    # 4️⃣ 图片银行分组操作（add / rename / delete）
    @staticmethod
    def operate_group(
        token: str,
        operation: str,
        group_id: Optional[int] = None,
        group_name: Optional[str] = None,
    ):
        """
        图片银行分组操作接口

        operation:
            - add
            - rename
            - delete
        """
        return call_api(
            "alibaba.icbu.photobank.group.operate",
            token,
            {
                "photo_group_operation_request": {
                    "operation": operation,
                    "group_id": group_id,
                    "group_name": group_name,
                }
            },
            http_method="POST",
        )

    # 5️⃣ 图片银行图片上传（photobank.upload）
    @staticmethod
    def upload_image(
        token: str,
        file_name: str,
        image_bytes: bytes,
        group_id: Optional[str] = None,
        extra_context: Optional[Dict[str, Any]] = None,
    ):
        """
        图片银行图片上传接口
        """
        return call_api(
            "alibaba.icbu.photobank.upload",
            token,
            {
                "file_name": file_name,
                "image_bytes": image_bytes,
                "group_id": group_id,
                "extra_context": extra_context,
            },
            http_method="POST",
        )

    # 6️⃣ 生成白底图（white.background.image.generate）
    @staticmethod
    def generate_white_background(
        token: str,
        image_url: str,
        display_name: str,
    ):
        """
        生成白底图接口
        """
        return call_api(
            "alibaba.icbu.white.background.image.generate",
            token,
            {
                "product_top_white_background_img_request": {
                    "imageUrl": image_url,
                    "displayName": display_name,
                }
            },
            http_method="POST",
        )

    @staticmethod
    def list_image_urls(token: str) -> list[str]:
        resp = AlibabaImageService.list_images(token=token)

        image_list = (
            resp
            .get("alibaba_icbu_photobank_list_response", {})
            .get("pagination_query_list", {})
            .get("list", {})
            .get("photobank_image_do", [])
        )

        return [img["url"] for img in image_list if "url" in img]