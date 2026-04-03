let
    // Update this path only if the workbook is moved.
    DatabaseFilePath = "H:\Mijn Drive\Vikram HB Intel Notebook LLM Data Source\Intel NL Field Covered stores 2025.xlsx",

    Source = Excel.Workbook(File.Contents(DatabaseFilePath), null, true),
    ProductTable = Source{[Item = "MSH PROD_DIM", Kind = "Sheet"]}[Data],
    TrimmedColumnNames = Table.TransformColumnNames(ProductTable, Text.Trim),

    // Standardize text-based columns used for filtering and key creation.
    Normalized = Table.TransformColumns(
        TrimmedColumnNames,
        {
            {"PROD_ID MSHNLARTICLE_DEF", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"MODEL", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"PROCESSOR TYPE", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"RAM", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"STORAGE", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"GRAPHICS", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Fabrician", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Segment", each if _ = null then null else Text.Trim(Text.From(_)), type text}
        }
    ),

    // Keep only Intel products based on processor or manufacturer markers.
    IntelOnly = Table.SelectRows(
        Normalized,
        each
            Text.Contains(Text.Upper(try [#"PROCESSOR TYPE"] otherwise ""), "INTEL")
            or Text.Contains(Text.Upper(try [Fabrician] otherwise ""), "INTEL")
    ),

    // Build a reusable spec key for model relationships.
    AddSpecKey = Table.AddColumn(
        IntelOnly,
        "SpecKey",
        each
            Text.Upper(
                Text.Combine(
                    {
                        try [#"PROCESSOR TYPE"] otherwise "",
                        try [RAM] otherwise "",
                        try [STORAGE] otherwise "",
                        try [GRAPHICS] otherwise ""
                    },
                    "|"
                )
            ),
        type text
    ),

    // Ensure one row per spec for a clean dimension table relationship.
    DimProductIntel = Table.Distinct(AddSpecKey, {"SpecKey"})
in
    DimProductIntel

