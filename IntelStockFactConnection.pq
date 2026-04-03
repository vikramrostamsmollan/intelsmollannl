let
    // Update this path only if the workbook is moved.
    DatabaseFilePath = "H:\Mijn Drive\Vikram HB Intel Notebook LLM Data Source\Intel NL Field Covered stores 2025.xlsx",

    Source = Excel.Workbook(File.Contents(DatabaseFilePath), null, true),
    StockTable = Source{[Item = "Intel Table 20242025 Stock", Kind = "Sheet"]}[Data],
    TrimmedColumnNames = Table.TransformColumnNames(StockTable, Text.Trim),

    // Product descriptor columns in the stock matrix.
    ProductColumns = {"chassis", "Scherm", "Inch", "Resolutie", "CPU", "RAM", "Storage", "Graphics"},

    // Unpivot store columns so each row becomes one product-store observation.
    Unpivoted = Table.UnpivotOtherColumns(TrimmedColumnNames, ProductColumns, "StoreName", "StockValue"),

    Normalized = Table.TransformColumns(
        Unpivoted,
        {
            {"chassis", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"CPU", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"RAM", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Storage", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Graphics", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"StoreName", each if _ = null then null else Text.Trim(Text.From(_)), type text}
        }
    ),

    // Keep Intel products only.
    IntelOnly = Table.SelectRows(Normalized, each Text.Contains(Text.Upper(try [CPU] otherwise ""), "INTEL")),

    AddSpecKey = Table.AddColumn(
        IntelOnly,
        "SpecKey",
        each
            Text.Upper(
                Text.Combine(
                    {
                        try [CPU] otherwise "",
                        try [RAM] otherwise "",
                        try [Storage] otherwise "",
                        try [Graphics] otherwise ""
                    },
                    "|"
                )
            ),
        type text
    ),

    AddStoreKey = Table.AddColumn(
        AddSpecKey,
        "StoreKey",
        each Text.Upper(try [StoreName] otherwise ""),
        type text
    )
in
    AddStoreKey
