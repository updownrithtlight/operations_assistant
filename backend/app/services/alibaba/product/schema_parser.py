# app/services/alibaba/product/schema_parser.py

import xml.etree.ElementTree as ET

class AlibabaSchemaParser:

    @staticmethod
    def parse_rules(field):
        rules = {}
        for rule in field.findall("./rules/rule"):
            rules.setdefault(rule.get("name"), []).append(rule.attrib)
        return rules

    @staticmethod
    def parse_field(field, parent_path=""):
        field_id = field.get("id")
        path = f"{parent_path}.{field_id}" if parent_path else field_id

        children = [
            AlibabaSchemaParser.parse_field(sub, path)
            for sub in field.findall("./fields/field")
        ]

        options = [
            {k: v for k, v in opt.attrib.items()}
            for opt in field.findall("./options/option")
        ]

        rules = AlibabaSchemaParser.parse_rules(field)

        return {
            "id": field_id,
            "path": path,
            "name": field.get("name"),
            "type": field.get("type"),
            "rules": rules,
            "required": "requiredRule" in rules,
            "default": field.findtext("value"),
            "options": options,
            "children": children
        }

    @staticmethod
    def to_json(schema_xml: str):
        root = ET.fromstring(schema_xml)
        return [
            AlibabaSchemaParser.parse_field(field)
            for field in root.findall("./field")
        ]
