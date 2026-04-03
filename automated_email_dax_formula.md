# Automated Email DAX Formula for Power BI

## Overview

This DAX measure creates clickable email links directly from Power BI reports without requiring Power Automate or Power Apps. Users can click on a row to generate an email with contextual information pre-filled.

## Basic Formula Structure

```dax
Email Measure = 
VAR NewLine = CHAR(13) & CHAR(10)
VAR EmployeeEmail = SELECTEDVALUE('Employee'[Email])
VAR ManagerEmail = SELECTEDVALUE('Employee'[ManagerEmail])
VAR EmployeeName = SELECTEDVALUE('Employee'[Name])
VAR SalesAmount = [Total Sales]
VAR QuotaPercentage = [Quota %]

RETURN
    "mailto:" & EmployeeEmail & 
    "?cc=" & ManagerEmail & 
    "&subject=" & "Your Monthly Sales Performance" & 
    "&body=" & 
        "Hi " & EmployeeName & "," & NewLine & NewLine &
        "Your sales performance this month was outstanding!" & NewLine & NewLine &
        "Sales Amount: " & FORMAT(SalesAmount, "#,##0") & NewLine &
        "Quota Achievement: " & FORMAT(QuotaPercentage, "0.0%") & NewLine & NewLine &
        "Keep up the great work!" & NewLine & NewLine &
        "Best regards," & NewLine &
        "Management Team"
```

## Advanced Formula with Conditional Logic

```dax
Email Performance Notice = 
VAR NewLine = CHAR(13) & CHAR(10)
VAR EmployeeEmail = SELECTEDVALUE('Employee'[Email])
VAR ManagerEmail = SELECTEDVALUE('Employee'[ManagerEmail])
VAR EmployeeName = SELECTEDVALUE('Employee'[Name])
VAR SalesAmount = [Total Sales]
VAR QuotaPercentage = [Quota %]
VAR NewDeals = [New Deals]
VAR ClosedDeals = [Closed Deals]
VAR Churn = [Churn Rate]
VAR ARR = [Annual Recurring Revenue]

// Performance rating based on quota percentage
VAR PerformanceRating = 
    SWITCH(
        TRUE(),
        QuotaPercentage >= 1.1, "Outstanding",
        QuotaPercentage >= 1.0, "On Target",
        "Needs Improvement"
    )

// Greeting based on performance
VAR Greeting = 
    SWITCH(
        TRUE(),
        QuotaPercentage >= 1.1, "Congratulations on your exceptional performance!",
        QuotaPercentage >= 1.0, "Great job meeting your targets!",
        "Let's work together to improve your results."
    )

// Escape percentage sign for URL encoding
VAR QuotaPercentageFormatted = 
    SUBSTITUTE(
        FORMAT(QuotaPercentage, "0.0%"),
        "%",
        "%25"
    )

RETURN
    "mailto:" & EmployeeEmail & 
    "?cc=" & ManagerEmail & 
    "&subject=" & "Your Monthly Sales Performance - " & PerformanceRating & 
    "&body=" & 
        "Hi " & EmployeeName & "," & NewLine & NewLine &
        Greeting & NewLine & NewLine &
        "Here's your performance summary:" & NewLine & NewLine &
        "Sales Amount: " & FORMAT(SalesAmount, "$#,##0") & NewLine &
        "Quota Achievement: " & QuotaPercentageFormatted & NewLine &
        "New Deals: " & FORMAT(NewDeals, "#,##0") & NewLine &
        "Closed Deals: " & FORMAT(ClosedDeals, "#,##0") & NewLine &
        "Churn Rate: " & FORMAT(Churn, "0.0%") & NewLine &
        "ARR: " & FORMAT(ARR, "$#,##0") & NewLine & NewLine &
        "Keep pushing forward!" & NewLine & NewLine &
        "Best regards," & NewLine &
        "Sales Management Team"
```

## Key Components Explained

### 1. Mailto Protocol
```
mailto:recipient@company.com
```
This opens the user's default email client with the recipient pre-filled.

### 2. URL Parameters
- `?cc=` - Carbon copy recipients
- `?bcc=` - Blind carbon copy recipients
- `?subject=` - Email subject line
- `?body=` - Email body content

### 3. New Line Characters
```dax
VAR NewLine = CHAR(13) & CHAR(10)
```
This creates a carriage return + line feed, which Outlook and other email clients interpret as a new line.

### 4. Dynamic Values with SELECTEDVALUE
```dax
SELECTEDVALUE('Employee'[Email])
```
Returns the email address only when a single value is selected in the current context.

### 5. Number Formatting
```dax
FORMAT(SalesAmount, "$#,##0")      // Currency with thousand separators
FORMAT(QuotaPercentage, "0.0%")    // Percentage with one decimal
```

### 6. Special Character Escaping
```dax
SUBSTITUTE(FORMAT(QuotaPercentage, "0.0%"), "%", "%25")
```
The `%` character has special meaning in URLs and must be escaped as `%25`.

## Setup Instructions

### Step 1: Create the Measure
1. In Power BI Desktop, go to the **Modeling** tab
2. Click **New Measure**
3. Paste the DAX formula
4. Rename it to something like "Email Performance Notice"

### Step 2: Configure the Table Visual
1. Select your table visual
2. Go to **Format** pane
3. Expand **Cell elements**
4. Select the column you want to make clickable (e.g., Employee Name)
5. Turn on **Web URL**
6. Select your email measure from the dropdown

### Step 3: Display as Icon (Optional)
1. Select your email measure
2. Go to **Measure Tools** → **Data category**
3. Choose **Web URL**
4. In table formatting options, go to **URL icon**
5. Turn it on for values
6. Rename the column header to "Mail" or leave it empty

## Usage Example

When a user clicks on an employee row, the email client opens with:

**To:** james.hartley@company.com  
**CC:** manager@company.com  
**Subject:** Your Monthly Sales Performance - Outstanding  

**Body:**
```
Hi James Hartley,

Congratulations on your exceptional performance!

Here's your performance summary:

Sales Amount: $125,000
Quota Achievement: 125.0%
New Deals: 15
Closed Deals: 12
Churn Rate: 2.5%
ARR: $1,500,000

Keep pushing forward!

Best regards,
Sales Management Team
```

## Tips and Best Practices

1. **Test with different selections**: Ensure SELECTEDVALUE returns the correct data when only one row is selected
2. **Handle blank values**: Use IF or COALESCE to handle cases where email might be blank
3. **Escape special characters**: Characters like `%`, `&`, `?`, `=` need URL encoding
4. **Keep body concise**: Long emails may be truncated in some email clients
5. **Use variables**: Break complex formulas into variables for readability
6. **Format numbers appropriately**: Use consistent formatting for currency, percentages, etc.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email body doesn't show | Check for unescaped special characters (`%`, `&`, `?`) |
| Wrong recipient | Verify SELECTEDVALUE returns correct value in current context |
| No new lines in body | Ensure `CHAR(13)&CHAR(10)` is used correctly |
| Measure doesn't appear as URL | Set Data category to "Web URL" in Measure Tools |
