from backend.app.services.alibaba.alibaba_client import call_api


class AlibabaCategoryService:

    @staticmethod
    def get_groups(token):
        return call_api(
            "alibaba.icbu.product.group.get",
            token
        )

    @staticmethod
    def get_categories(token, parent_id=0):
        return call_api(
            "alibaba.icbu.category.get",
            token,
            {"parentId": parent_id}
        )
