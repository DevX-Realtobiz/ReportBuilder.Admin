using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ReportBuilder.Admin.Web.Models
{
    public class ConnectViewModel
    {
        public string Provider { get; set; }
        public string ServerName { get; set; }
        public string InitialCatalog { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public bool IntegratedSecurity { get; set; }


        public string AccountApiKey { get; set; }        
        public string DatabaseApiKey { get; set; }
    }
}