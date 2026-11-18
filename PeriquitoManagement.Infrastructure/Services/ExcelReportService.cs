using ClosedXML.Excel;
using PeriquitoManagement.Application.DTOs;
using PeriquitoManagement.Application.Interfaces;

namespace PeriquitoManagement.Infrastructure.Services;

public sealed class ExcelReportService : IExcelReportService
{
    private const string CurrencyFormat = "\"S/ \"#,##0.00;[Red]-\"S/ \"#,##0.00";
    private const string Navy = "17365D";
    private const string LightBlue = "D9EAF7";

    public Task<byte[]> GenerateSalesReportAsync(
        SalesReportDataDto report,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        using var workbook = new XLWorkbook();
        workbook.Properties.Author = "Restaurante Periquito";
        workbook.Properties.Title = "Reporte de ventas";
        workbook.Properties.Subject = "Resumen de ventas, costos y ganancias";

        WriteSummarySheet(workbook.Worksheets.Add("Resumen"), report);
        WriteSalesSheet(workbook.Worksheets.Add("Ventas"), report);
        WriteProductsSheet(workbook.Worksheets.Add("Productos"), report);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return Task.FromResult(stream.ToArray());
    }

    private static void WriteSummarySheet(IXLWorksheet sheet, SalesReportDataDto report)
    {
        SetTitle(sheet, 5, report);
        sheet.Cell(4, 1).Value = "Indicador";
        sheet.Cell(4, 2).Value = "Valor";
        SetHeader(sheet.Range(4, 1, 4, 2));

        var rows = new (string Label, object Value, bool Money)[]
        {
            ("Ingresos", report.Summary.Revenue, true),
            ("Ganancia bruta", report.Summary.GrossProfit, true),
            ("Costos", report.Summary.Cost, true),
            ("Cantidad de ventas", report.Summary.CompletedOrders, false),
            ("Ticket promedio", report.Summary.AverageTicket, true)
        };

        for (var index = 0; index < rows.Length; index++)
        {
            var row = index + 5;
            sheet.Cell(row, 1).Value = rows[index].Label;
            sheet.Cell(row, 2).Value = XLCellValue.FromObject(rows[index].Value);
            if (rows[index].Money)
                sheet.Cell(row, 2).Style.NumberFormat.Format = CurrencyFormat;
            if (index % 2 == 0)
                sheet.Range(row, 1, row, 2).Style.Fill.BackgroundColor = XLColor.FromHtml("F3F6FA");
        }

        sheet.Range(4, 1, 9, 2).SetAutoFilter();
        sheet.SheetView.FreezeRows(4);
        sheet.Column(1).Width = 30;
        sheet.Column(2).Width = 22;
    }

    private static void WriteSalesSheet(IXLWorksheet sheet, SalesReportDataDto report)
    {
        SetTitle(sheet, 8, report);
        var headers = new[]
        {
            "Venta", "Pedido", "Fecha (Perú)", "Mesa", "Mesero", "Ingresos", "Costos", "Ganancia bruta"
        };
        WriteHeaders(sheet, 4, headers);

        var row = 5;
        foreach (var sale in report.Sales)
        {
            sheet.Cell(row, 1).Value = sale.SaleId;
            sheet.Cell(row, 2).Value = sale.OrderId;
            sheet.Cell(row, 3).Value = sale.SoldAtUtc.AddHours(-5);
            sheet.Cell(row, 3).Style.DateFormat.Format = "dd/mm/yyyy hh:mm";
            sheet.Cell(row, 4).Value = sale.TableNumber.HasValue ? sale.TableNumber.Value : 0;
            if (!sale.TableNumber.HasValue)
                sheet.Cell(row, 4).Clear(XLClearOptions.Contents);
            sheet.Cell(row, 5).Value = sale.WaiterUsername;
            sheet.Cell(row, 6).Value = sale.Revenue;
            sheet.Cell(row, 7).Value = sale.Cost;
            sheet.Cell(row, 8).Value = sale.GrossProfit;
            SetCurrency(sheet.Range(row, 6, row, 8));
            row++;
        }

        var lastDataRow = row - 1;
        sheet.Range(4, 1, Math.Max(4, lastDataRow), headers.Length).SetAutoFilter();
        WriteTotals(sheet, row, 8, $"TOTAL ({report.Sales.Count} ventas)", 0,
            report.Sales.Sum(sale => sale.Revenue),
            report.Sales.Sum(sale => sale.Cost),
            report.Sales.Sum(sale => sale.GrossProfit));
        sheet.Cell(row, 2).Clear(XLClearOptions.Contents);
        sheet.SheetView.FreezeRows(4);
        sheet.Columns(1, 8).AdjustToContents(10, 40);
        sheet.Column(5).Width = Math.Clamp(sheet.Column(5).Width, 18, 32);
    }

    private static void WriteProductsSheet(IXLWorksheet sheet, SalesReportDataDto report)
    {
        SetTitle(sheet, 5, report);
        var headers = new[] { "Plato", "Cantidad vendida", "Ingresos", "Costos", "Ganancia bruta" };
        WriteHeaders(sheet, 4, headers);

        var row = 5;
        foreach (var product in report.Products)
        {
            sheet.Cell(row, 1).Value = product.DishName;
            sheet.Cell(row, 2).Value = product.QuantitySold;
            sheet.Cell(row, 3).Value = product.Revenue;
            sheet.Cell(row, 4).Value = product.Cost;
            sheet.Cell(row, 5).Value = product.GrossProfit;
            SetCurrency(sheet.Range(row, 3, row, 5));
            row++;
        }

        var lastDataRow = row - 1;
        sheet.Range(4, 1, Math.Max(4, lastDataRow), headers.Length).SetAutoFilter();
        WriteTotals(sheet, row, 5, "TOTAL", report.Products.Sum(product => product.QuantitySold),
            report.Products.Sum(product => product.Revenue),
            report.Products.Sum(product => product.Cost),
            report.Products.Sum(product => product.GrossProfit));
        sheet.SheetView.FreezeRows(4);
        sheet.Columns(1, 5).AdjustToContents(12, 40);
    }

    private static void SetTitle(IXLWorksheet sheet, int lastColumn, SalesReportDataDto report)
    {
        sheet.Range(1, 1, 1, lastColumn).Merge();
        sheet.Cell(1, 1).Value = "Restaurante Periquito";
        sheet.Cell(1, 1).Style.Font.Bold = true;
        sheet.Cell(1, 1).Style.Font.FontSize = 18;
        sheet.Cell(1, 1).Style.Font.FontColor = XLColor.White;
        sheet.Range(1, 1, 1, lastColumn).Style.Fill.BackgroundColor = XLColor.FromHtml(Navy);
        sheet.Range(1, 1, 1, lastColumn).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

        sheet.Range(2, 1, 2, lastColumn).Merge();
        var from = report.FromDate?.ToString("dd/MM/yyyy") ?? "Sin límite inicial";
        var to = report.ToDate?.ToString("dd/MM/yyyy") ?? "Sin límite final";
        sheet.Cell(2, 1).Value = $"Rango de fechas: {from} - {to} (America/Lima)";
        sheet.Cell(2, 1).Style.Font.Italic = true;
        sheet.Row(1).Height = 28;
        sheet.Row(2).Height = 22;
    }

    private static void WriteHeaders(IXLWorksheet sheet, int row, IReadOnlyList<string> headers)
    {
        for (var column = 0; column < headers.Count; column++)
            sheet.Cell(row, column + 1).Value = headers[column];
        SetHeader(sheet.Range(row, 1, row, headers.Count));
    }

    private static void SetHeader(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontColor = XLColor.White;
        range.Style.Fill.BackgroundColor = XLColor.FromHtml(Navy);
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
    }

    private static void SetCurrency(IXLRange range)
    {
        range.Style.NumberFormat.Format = CurrencyFormat;
    }

    private static void WriteTotals(
        IXLWorksheet sheet,
        int row,
        int columns,
        string label,
        long quantityOrCount,
        decimal revenue,
        decimal cost,
        decimal grossProfit)
    {
        sheet.Cell(row, 1).Value = label;
        if (columns == 8)
        {
            sheet.Cell(row, 2).Value = quantityOrCount;
            sheet.Cell(row, 6).Value = revenue;
            sheet.Cell(row, 7).Value = cost;
            sheet.Cell(row, 8).Value = grossProfit;
            SetCurrency(sheet.Range(row, 6, row, 8));
        }
        else
        {
            sheet.Cell(row, 2).Value = quantityOrCount;
            sheet.Cell(row, 3).Value = revenue;
            sheet.Cell(row, 4).Value = cost;
            sheet.Cell(row, 5).Value = grossProfit;
            SetCurrency(sheet.Range(row, 3, row, 5));
        }

        sheet.Range(row, 1, row, columns).Style.Font.Bold = true;
        sheet.Range(row, 1, row, columns).Style.Fill.BackgroundColor = XLColor.FromHtml(LightBlue);
        sheet.Range(row, 1, row, columns).Style.Border.TopBorder = XLBorderStyleValues.Thin;
    }
}
