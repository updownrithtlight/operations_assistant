
import xml.etree.ElementTree as ET
from typing import Dict, Any, List


class AlibabaSchemaFiller:
    """
    工业级 Schema Filler
    - 支持 required 校验
    - 支持 name -> id 映射
    - 支持 debug & report
    """

    def __init__(self, schema_xml: str, debug: bool = True):
        self.root = ET.fromstring(schema_xml)
        self.debug = debug

        self.errors: List[str] = []
        self.warnings: List[str] = []

        # name -> id 映射表
        self.name_map = self._build_name_map()

    # ========= 对外主入口 =========
    def fill(self, data: Dict[str, Any]) -> str:
        """
        data 可以混合使用：
        - field_id
        - field_name（中文/英文）
        """

        normalized_data = self._normalize_keys(data)

        for field in self.root.findall(".//field"):
            self._fill_field(field, normalized_data)

        self._validate_required(normalized_data)

        if self.debug:
            self._print_report()

        return ET.tostring(self.root, encoding="unicode")

    # ========= Key 标准化 =========
    def _normalize_keys(self, data: dict) -> dict:
        result = {}

        for k, v in data.items():
            if k in self.name_map:
                result[self.name_map[k]] = v
            else:
                result[k] = v

        return result

    def _build_name_map(self) -> dict:
        """
        构建 field.name -> field.id
        """
        mapping = {}
        for field in self.root.findall(".//field"):
            fid = field.get("id")
            name = field.get("name")
            if fid and name:
                mapping[name] = fid
        return mapping

    # ========= Field 调度 =========
    def _fill_field(self, field: ET.Element, data: dict):
        fid = field.get("id")
        ftype = field.get("type")

        if fid not in data:
            return

        try:
            value = data[fid]

            if ftype in ("input", "singleCheck"):
                self._fill_single(field, value)

            elif ftype == "multiCheck":
                self._fill_multi(field, value)

            elif ftype == "complex":
                self._fill_complex(field, value)

            elif ftype == "multiComplex":
                self._fill_multi_complex(field, value)

        except Exception as e:
            self.errors.append(f"{fid} 填充异常: {e}")

    # ========= 填充实现 =========
    def _fill_single(self, field, value):
        node = field.find("value")
        if node is not None:
            node.text = str(value)

    def _fill_multi(self, field, values):
        if not isinstance(values, list):
            raise ValueError("multiCheck 必须是 list")

        node = field.find("values")
        if node is None:
            return

        node.clear()
        for v in values:
            val = ET.SubElement(node, "value")
            val.text = str(v)

    def _fill_complex(self, field, obj):
        if not isinstance(obj, dict):
            raise ValueError("complex 必须是 dict")

        node = field.find("complex-value")
        if node is None:
            return

        for sub in node.findall("field"):
            sid = sub.get("id")
            if sid in obj:
                self._fill_single(sub, obj[sid])

    def _fill_multi_complex(self, field, items):
        if not isinstance(items, list):
            raise ValueError("multiComplex 必须是 list[dict]")

        values_node = field.find("values")
        if values_node is None:
            return

        values_node.clear()

        template = field.find(".//complex-value")
        if template is None:
            return

        for item in items:
            cv = ET.SubElement(values_node, "complex-value")

            for sub in template.findall("field"):
                sid = sub.get("id")
                new_field = ET.SubElement(cv, "field", sub.attrib)

                if sid in item:
                    value_node = ET.SubElement(new_field, "value")
                    value_node.text = str(item[sid])

    # ========= required 校验 =========
    def _validate_required(self, data):
        for field in self.root.findall(".//field"):
            if field.get("required") == "true":
                fid = field.get("id")
                if fid not in data:
                    self.errors.append(f"缺少必填字段: {fid} ({field.get('name')})")

    # ========= Debug 输出 =========
    def _print_report(self):
        print("\n📋 Schema Fill Report")

        if self.errors:
            print("❌ Errors:")
            for e in self.errors:
                print(" -", e)

        if self.warnings:
            print("⚠️ Warnings:")
            for w in self.warnings:
                print(" -", w)

        if not self.errors and not self.warnings:
            print("✅ Schema 填充完成，无异常")
