from backend.app.services.alibaba.alibaba_client import call_api


class AlibabaSkuService:

    @staticmethod
    def get_sku_attrs(token, cat_id):
        return call_api(
            "alibaba.icbu.category.level.attr.get",
            token,
            {"catId": cat_id}
        )
