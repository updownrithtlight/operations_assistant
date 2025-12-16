def ensure_price_integrity(flat_data: dict):
    """
    保证价格结构满足阿里国际站校验（scPrice 1 / 2 / 3）
    """

    sc_price = flat_data.get("scPrice")
    if not sc_price:
        raise ValueError("scPrice is required")

    # ========= 工具函数 =========
    def has_prefix(prefix: str) -> bool:
        return any(k.startswith(prefix) for k in flat_data)

    def get_first_ladder_price():
        for i in range(4):
            q = flat_data.get(f"ladderPrice.ladderPrice_{i}.quantity")
            p = flat_data.get(f"ladderPrice.ladderPrice_{i}.price")
            if q is not None and p is not None:
                return q, p
        return None, None

    def get_first_sku_price():
        for k, v in flat_data.items():
            if k.endswith(".price") and k.startswith("sku."):
                return v
        return None

    def ensure_fob(price: float):
        if not has_prefix("fob."):
            flat_data.update({
                "fob.range_min": price,
                "fob.range_max": price,
                "fob.unit_type": "1",  # USD
            })

    # ========= scPrice = 1（阶梯定价） =========
    if sc_price == "1":
        if not has_prefix("ladderPrice."):
            raise ValueError("scPrice=1 requires ladderPrice")

        qty, price = get_first_ladder_price()
        if price is None:
            raise ValueError("ladderPrice exists but no valid price found")

        # MOQ 兜底
        flat_data.setdefault("minOrderQuantity", qty or 1)

        # FOB 必须存在
        ensure_fob(price)

    # ========= scPrice = 2（区间价） =========
    elif sc_price == "2":
        min_p = flat_data.get("fob.range_min")
        max_p = flat_data.get("fob.range_max")

        if min_p is None or max_p is None:
            raise ValueError("scPrice=2 requires fob.range_min & fob.range_max")

        flat_data.setdefault("fob.unit_type", "1")

    # ========= scPrice = 3（SKU 定价） =========
    elif sc_price == "3":
        price = get_first_sku_price()
        if price is None:
            raise ValueError("scPrice=3 requires sku.price")

        ensure_fob(price)

    else:
        raise ValueError(f"Unsupported scPrice: {sc_price}")
