
# schema/complex_value.py
class ComplexValue:
    def __init__(self):
        self.fields = {}

    def set_input(self, field_id: str, value: str):
        self.fields[field_id] = value

    def set_single_check(self, field_id: str, value: str):
        self.fields[field_id] = value
