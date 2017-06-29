using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace ReportBuilder.Admin.Web.Models
{
    public class ManageViewModel
    {
        [Required]
        public string AccountApiKey { get; set; }
        [Required]
        public string DatabaseApiKey { get; set; }

        public List<TableViewModel> Tables { get; set; }
    }
}