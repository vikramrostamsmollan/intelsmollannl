let
    // Update this path only if the workbook is moved.
    DatabaseFilePath = "H:\Mijn Drive\Vikram HB Intel Notebook LLM Data Source\Intel NL Field Covered stores 2025.xlsx",

    Source = Excel.Workbook(File.Contents(DatabaseFilePath), null, true),
    StoreTable = Source{[Item = "Store_DIM", Kind = "Sheet"]}[Data],
    TrimmedColumnNames = Table.TransformColumnNames(StoreTable, Text.Trim),

    Normalized = Table.TransformColumns(
        TrimmedColumnNames,
        {
            {"Name", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Country", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Retailer", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Retailer Id", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Store Id", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Store Code", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"Location", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"City", each if _ = null then null else Text.Trim(Text.From(_)), type text},
            {"State", each if _ = null then null else Text.Trim(Text.From(_)), type text}
        }
    ),

    AddStoreKey = Table.AddColumn(
        Normalized,
        "StoreKey",
        each Text.Upper(try [Name] otherwise ""),
        type text
    ),

    DimStoreIntel = Table.Distinct(AddStoreKey, {"StoreKey"})
in
    DimStoreIntel
