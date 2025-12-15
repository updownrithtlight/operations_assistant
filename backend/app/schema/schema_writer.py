
# schema/schema_writer.py
import xml.etree.ElementTree as ET
from .field import InputField, SingleCheckField, MultiCheckField


def write_param_xml(field_map: dict) -> str:
    root = ET.Element("itemSchema")

    for field in field_map.values():
        field_el = ET.SubElement(root, "field", {"id": field.id})

        if isinstance(field, InputField) or isinstance(field, SingleCheckField):
            if field.value is not None:
                val_el = ET.SubElement(field_el, "value")
                val_el.text = str(field.value)

        elif isinstance(field, MultiCheckField):
            values_el = ET.SubElement(field_el, "values")
            for v in field.values:
                val_el = ET.SubElement(values_el, "value")
                val_el.text = str(v)

    return ET.tostring(root, encoding="unicode")
