class PayloadBuilder:
    def __init__(self, schema_json: list[dict]):
        self.schema_json = schema_json

    def build(self, flat_data: dict) -> dict:
        """
        path -> tree payload
        """
        payload = {}

        for path, value in flat_data.items():
            self._set(payload, path.split("."), value)

        return payload

    def _set(self, obj: dict, path: list[str], value):
        key = path[0]

        if len(path) == 1:
            obj[key] = value
            return

        if key not in obj:
            obj[key] = {}

        self._set(obj[key], path[1:], value)
