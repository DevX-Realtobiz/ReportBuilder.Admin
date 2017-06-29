ko.validation.rules['requiredIf'] = {
    validator: function (val, otherVal) {
        if (otherVal() === false) {
            return val!=null && val!='';
        }

        return true;
    },
    message: 'This field is required'
};
ko.validation.registerExtenders();
