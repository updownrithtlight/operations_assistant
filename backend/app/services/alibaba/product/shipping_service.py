

class AlibabaShippingService:

    @staticmethod
    def list_templates(token):
        return call_api(
            "alibaba.wholesale.shippingline.template.list",
            token
        )
