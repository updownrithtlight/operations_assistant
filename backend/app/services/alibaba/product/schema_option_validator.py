class SchemaOptionValidator:

    @staticmethod
    def validate(schema_json: list[dict], product_data: dict):
        """
        校验 product_data 中的 option 值是否合法
        """
        errors = []

        def walk(fields: list[dict]):
            for f in fields:
                field_id = f["id"]
                field_name = f.get("name") or field_id
                field_type = f["type"]
                options = f.get("options", [])
                children = f.get("children", [])

                # ===== 单选 =====
                if field_type == "singleCheck" and field_id in product_data:
                    value = product_data[field_id]
                    valid_values = {opt["value"] for opt in options}

                    if value not in valid_values:
                        errors.append({
                            "field_id": field_id,
                            "field_name": field_name,
                            "reason": "invalid option value",
                            "value": value,
                            "allowed": list(valid_values)
                        })

                # ===== 多选 =====
                if field_type == "multiCheck" and field_id in product_data:
                    values = product_data[field_id]
                    if not isinstance(values, (list, tuple)):
                        errors.append({
                            "field_id": field_id,
                            "field_name": field_name,
                            "reason": "value must be list"
                        })
                    else:
                        valid_values = {opt["value"] for opt in options}
                        for v in values:
                            if v not in valid_values:
                                errors.append({
                                    "field_id": field_id,
                                    "field_name": field_name,
                                    "reason": "invalid option value",
                                    "value": v,
                                    "allowed": list(valid_values)
                                })

                # ===== 递归 children =====
                if children:
                    walk(children)

        walk(schema_json)

        return {
            "ok": len(errors) == 0,
            "errors": errors
        }
