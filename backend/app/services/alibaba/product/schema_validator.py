class SchemaValidator:

    @staticmethod
    def validate(schema_json: list[dict], product_data: dict):
        """
        校验 product_data 是否满足 schema required 规则
        """
        errors = []

        def walk(fields: list[dict]):
            for f in fields:
                field_id = f["id"]
                field_name = f.get("name") or field_id
                field_type = f["type"]
                required = f.get("required", False)
                children = f.get("children", [])

                # ===== 非 complex：直接校验 =====
                if required and field_type not in ("complex", "multiComplex"):
                    if not SchemaValidator._has_value(product_data.get(field_id)):
                        errors.append({
                            "field_id": field_id,
                            "field_name": field_name,
                            "reason": "required field missing"
                        })

                # ===== complex / multiComplex =====
                if field_type in ("complex", "multiComplex"):
                    if required:
                        # 至少一个子字段有值
                        if not any(
                            SchemaValidator._has_value(product_data.get(c["id"]))
                            for c in children
                        ):
                            errors.append({
                                "field_id": field_id,
                                "field_name": field_name,
                                "reason": "required complex field missing"
                            })

                    # 继续递归 children
                    walk(children)

        walk(schema_json)

        return {
            "ok": len(errors) == 0,
            "errors": errors
        }

    @staticmethod
    def _has_value(v):
        if v is None:
            return False
        if isinstance(v, str):
            return v.strip() != ""
        if isinstance(v, (list, tuple)):
            return len(v) > 0
        return True
