using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ReportBuilder.Admin.Web.Models
{
    public class TableViewModel
    {
        public int Id { get; set; }
        public string TableName { get; set; }
        public string DisplayName { get; set; }
        public bool Selected { get; set; }
        public bool IsView { get; set; }
        public int DisplayOrder { get; set; }
        public string AccountIdField { get; set; }

        public List<ColumnViewModel> Columns { get; set; }
    }
}