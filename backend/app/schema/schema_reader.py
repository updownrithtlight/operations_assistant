
# schema/schema_reader.py
import xml.etree.ElementTree as ET
from .field import InputField, SingleCheckField, MultiCheckField


def read_schema_xml(xml: str):
    root = ET.fromstring(xml)
    field_map = {}

    for field in root.findall("./field"):
        field_id = field.get("id")
        field_type = field.get("type")

        if field_type == "input":
            field_map[field_id] = InputField(field_id)
        elif field_type == "singleCheck":
            field_map[field_id] = SingleCheckField(field_id)
        elif field_type == "multiCheck":
            field_map[field_id] = MultiCheckField(field_id)
        # complex / multiComplex 下一步扩展

    return field_map
