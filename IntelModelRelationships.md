# Intel Model Relationships (Power BI Desktop)

## Queries to create

1. `DimProduct_Intel`
   - Use script: `IntelProductsConnection.pq`
2. `DimStore_Intel`
   - Use script: `StoreDimensionConnection.pq`
3. `FactIntelStockByStore`
   - Use script: `IntelStockFactConnection.pq`

## Relationship map

Create these relationships in Model view:

1. `DimProduct_Intel[SpecKey]` (one) -> `FactIntelStockByStore[SpecKey]` (many)
2. `DimStore_Intel[StoreKey]` (one) -> `FactIntelStockByStore[StoreKey]` (many)

Recommended settings:
- Cross filter direction: `Single`
- Make relationship active: `Yes`

## Notes

- `SpecKey` is built from CPU/Memory/Storage/Graphics to link product specs between tables.
- `StoreKey` is normalized uppercase store name so the stock matrix store columns can join to `Store_DIM` names.
- If you see unmatched rows, first check whitespace or naming differences in store names.

## Quick validation DAX

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'DimStore_Intel'[Name],
    "Rows", COUNTROWS('FactIntelStockByStore')
)
ORDER BY
    'DimStore_Intel'[Name]
```

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'DimProduct_Intel'[Segment],
    "Rows", COUNTROWS('FactIntelStockByStore')
)
ORDER BY
    'DimProduct_Intel'[Segment]
```
