from typing import Optional

from backend.app.services.alibaba.alibaba_client import call_api


class AlibabaVideoService:
    """
    ICBU 视频相关接口封装
    """

    # 1️⃣ 视频文件上传
    @staticmethod
    def upload(
        token: str,
        video_path: str,
        video_name: str,
        cover_url: Optional[str] = None,
    ):
        """
        alibaba.icbu.video.upload
        """
        return call_api(
            "alibaba.icbu.video.upload",
            token,
            {
                "video_path": video_path,
                "video_name": video_name,
                "cover_url": cover_url,
            },
            http_method="POST",
        )

    # 2️⃣ 视频查询
    @staticmethod
    def query(
        token: str,
        title: Optional[str] = None,
        video_id: Optional[str] = None,
        current_page: int = 1,
        page_size: int = 10,
    ):
        """
        alibaba.icbu.video.query
        """
        return call_api(
            "alibaba.icbu.video.query",
            token,
            {
                "title": title,
                "id": video_id,
                "current_page": current_page,
                "page_size": page_size,
            },
            http_method="POST",
        )

    # 3️⃣ 查询视频关联的商品 ID 列表
    @staticmethod
    def list_related_products(
        token: str,
        video_id: str,
        type_: str,
    ):
        """
        alibaba.icbu.video.relation.product.list

        type:
            - videoId        主图视频
            - detailVideoId  详情视频
        """
        return call_api(
            "alibaba.icbu.video.relation.product.list",
            token,
            {
                "video_id": video_id,
                "type": type_,
            },
            http_method="POST",
        )

    # 4️⃣ 查询视频关联的商品详情
    @staticmethod
    def get_related_product_detail(
        token: str,
        video_id: Optional[str] = None,
        product_id: Optional[str] = None,
    ):
        """
        alibaba.icbu.video.relation.product.detail
        """
        return call_api(
            "alibaba.icbu.video.relation.product.detail",
            token,
            {
                "video_id": video_id,
                "product_id": product_id,
            },
            http_method="POST",
        )

    # 5️⃣ 设置视频为商品主图视频
    @staticmethod
    def set_product_main_video(
        token: str,
        video_id: str,
        product_id: str,
    ):
        """
        alibaba.icbu.video.relation.product.main
        """
        return call_api(
            "alibaba.icbu.video.relation.product.main",
            token,
            {
                "video_id": video_id,
                "product_id": product_id,
            },
            http_method="POST",
        )
