using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ReportBuilder.Admin.Web.Models
{
    public enum FieldTypes
    {
        Boolean,
        DateTime,
        Varchar,
        Money,
        Int,
        Double
    }

    public enum JoinTypes
    {
        Inner,
        Left,
        Right
    }

    public class ColumnViewModel
    {
        public int Id { get; set; }
        public string ColumnName { get; set; }
        public string DisplayName { get; set; }
        public bool Selected { get; set; }

        public int DisplayOrder { get; set; }

        public string FieldType { get; set; }
        public bool PrimaryKey { get; set; }

        public bool ForeignKey { get; set; }

        public bool AccountIdField { get; set; }

        public string ForeignTable { get; set; }

        public JoinTypes ForeignJoin { get; set; }

        public string ForeignKeyField { get; set; }

        public string ForeignValueField { get; set; }
    }
}