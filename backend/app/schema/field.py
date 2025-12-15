# schema/field.py
from typing import List, Dict, Any


class Field:
    def __init__(self, field_id: str, field_type: str):
        self.id = field_id
        self.type = field_type

    def to_xml(self):
        raise NotImplementedError

class InputField(Field):
    def __init__(self, field_id: str):
        super().__init__(field_id, "input")
        self.value = None

    def set_value(self, value: str):
        self.value = value

class SingleCheckField(Field):
    def __init__(self, field_id: str):
        super().__init__(field_id, "singleCheck")
        self.value = None

    def set_value(self, value: str):
        self.value = value

class MultiCheckField(Field):
    def __init__(self, field_id: str):
        super().__init__(field_id, "multiCheck")
        self.values: List[str] = []

    def add_value(self, value: str):
        self.values.append(value)
