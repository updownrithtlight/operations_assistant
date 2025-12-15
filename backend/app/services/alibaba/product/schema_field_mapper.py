class SchemaFieldMapper:
    """
    Excel / 原始输入 → schema path -> value（平铺）
    """

    def __init__(self, schema_json: list[dict]):
        self.schema_json = schema_json
        self.by_id: dict[str, dict] = {}
        self.by_name: dict[str, dict] = {}
        self._build_index(schema_json)

    # =========================
    # Index
    # =========================

    def _build_index(self, fields: list[dict]):
        for f in fields:
            field_id = f.get("id")
            field_name = f.get("name")

            # 1️⃣ 主索引：id（唯一可信）
            if field_id:
                self.by_id[field_id] = f

            # 2️⃣ 辅助索引：name（仅 Excel / UI）
            if field_name:
                # name 可能重复，避免覆盖
                self.by_name.setdefault(field_name, f)

            # 3️⃣ 递归 children
            for child in f.get("children", []) or []:
                self._build_index([child])

    # =========================
    # Public API
    # =========================

    def map_row(self, row: dict) -> dict:
        """
        Excel 一行 / 原始 dict
        → { schema.path: normalized_value }
        """
        flat_payload = {}

        for col, raw_value in row.items():
            if raw_value in ("", None):
                continue

            # 优先 id，其次 name
            field = self.by_id.get(col) or self.by_name.get(col)
            if not field:
                continue  # Excel 里多余列，直接忽略

            value = self._map_field(field, raw_value)

            if value is None:
                continue

            flat_payload[field["path"]] = value

        return flat_payload

    # =========================
    # Field mapping
    # =========================

    def _map_field(self, field: dict, raw_value):
        ftype = field.get("type")

        # 单选
        if ftype == "singleCheck":
            return self._map_single(field, raw_value)

        # 多选
        if ftype == "multiCheck":
            values = self._split(raw_value)
            return self._map_multi(field, values)

        # input / complex / multiInput
        # complex 不在 mapper 里造结构，只原样透传
        return raw_value

    # =========================
    # Option mapping
    # =========================

    def _map_single(self, field: dict, value):
        value_str = str(value)

        # 1️⃣ 优先匹配 option.value（官方 XML 用的就是这个）
        for opt in field.get("options", []):
            if opt.get("value") == value_str:
                return opt.get("value")

        # 2️⃣ 兼容 displayName（Excel / UI）
        for opt in field.get("options", []):
            if opt.get("displayName") == value_str:
                return opt.get("value")

        # 3️⃣ Other / inputValue
        if self._support_input(field):
            return {
                "value": -1,
                "inputValue": value_str
            }

        raise ValueError(
            f"[{field.get('id')}] 不支持的值: {value_str}，"
            f"可选值: {[o.get('value') for o in field.get('options', [])]}"
        )

    def _map_multi(self, field: dict, values: list):
        result = []

        for v in values:
            matched = False

            for opt in field.get("options", []):
                if opt.get("displayName") == v:
                    result.append(opt.get("value"))
                    matched = True
                    break

            if not matched:
                if self._support_input(field):
                    # multiCheck 的 inputValue 必须是对象
                    result.append({
                        "value": -1,
                        "inputValue": str(v)
                    })
                else:
                    raise ValueError(
                        f"[{field.get('id')}] 不支持的值: {v}"
                    )

        return result

    # =========================
    # Helpers
    # =========================

    def _support_input(self, field: dict) -> bool:
        """
        判断该字段是否支持 inputValue（Other）
        """
        for r in field.get("rules", {}).get("valueAttributeRule", []):
            if r.get("value") == "inputValue":
                return True
        return False

    @staticmethod
    def _split(value):
        """
        multiCheck 统一拆分规则
        """
        if isinstance(value, list):
            return value
        return [v.strip() for v in str(value).split("|") if v.strip()]
