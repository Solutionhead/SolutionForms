﻿/// <autosync enabled="true" />
/// <reference path="../app/bindings/datepicker.js" />
/// <reference path="../app/bindings/ko.bindings.bs-modal.js" />
/// <reference path="../app/bindings/ko.bindings.jq-autocomplete.js" />
/// <reference path="../App/bindings/ko.bindings.jq-payment.js" />
/// <reference path="../app/components/dataentry-form-view/dataentry-form-view.js" />
/// <reference path="../app/components/dataentry-table-view/dataentry-table-view.js" />
/// <reference path="../app/components/dataform-form-designer/dataform-form-designer.js" />
/// <reference path="../app/components/dataform-form-live/dataform-form-live.js" />
/// <reference path="../app/components/dataform-live/dataform-live.js" />
/// <reference path="../App/components/dynamic-form-ui/dynamic-form-ui.js" />
/// <reference path="../app/components/field-controls/checkboxes-field/checkboxes-field.js" />
/// <reference path="../app/components/field-controls/checkboxes-field/checkboxes-field-config.js" />
/// <reference path="../app/components/field-controls/date-field/date-field.js" />
/// <reference path="../app/components/field-controls/date-field/date-field-config.js" />
/// <reference path="../app/components/field-controls/hidden-field/hidden-field.js" />
/// <reference path="../app/components/field-controls/lookup-field/lookup-field.js" />
/// <reference path="../app/components/field-controls/lookup-field/lookup-field-config.js" />
/// <reference path="../app/components/field-controls/paragraph-text-field/paragraph-text-field.js" />
/// <reference path="../app/components/field-controls/select-field/select-field.js" />
/// <reference path="../app/components/field-controls/select-field/select-field-config.js" />
/// <reference path="../app/components/field-controls/table-field/table-field.js" />
/// <reference path="../app/components/field-controls/table-field/table-field-config.js" />
/// <reference path="../app/components/field-controls/text-field/text-field.js" />
/// <reference path="../app/components/form-containers/default-container/default-container.js" />
/// <reference path="../app/components/form-containers/empty-container/empty-container.js" />
/// <reference path="../app/components/form-field/form-field.js" />
/// <reference path="../app/core.js" />
/// <reference path="../app/lib/jquery.payment.js" />
/// <reference path="../app/lib/knockout-bootstrap-collapse-local/knockout.bootstrap.collapse.js" />
/// <reference path="../app/lib/knockout-projections.js" />
/// <reference path="../app/lib/kolite-local/knockout.activity.js" />
/// <reference path="../app/lib/kolite-local/knockout.command.js" />
/// <reference path="../app/lib/kolite-local/knockout.dirtyflag.js" />
/// <reference path="../app/lib/printthis/printthis.js" />
/// <reference path="../app/Models/formFieldDesigner.js" />
/// <reference path="../app/Models/formFieldLive.js" />
/// <reference path="../app/models/paymentinfo.js" />
/// <reference path="../app/plugins/getDataFromLocalStorePlugin.js" />
/// <reference path="../app/plugins/initializeFormValuesPlugin.js" />
/// <reference path="../app/plugins/saveToLocalDocumentStorePlugin.js" />
/// <reference path="../app/services/dataentriesservice.js" />
/// <reference path="../App/services/dataFormsService.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/appointment-editor/appointment-editor.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/appointments-controller/appointments-controller.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/daily-appointment-report/daily-appointment-report.js" />
/// <reference path="../App/tenant_customizations/green_cleaners/components/recurrence-scheduler/recurrence-scheduler.js" />
/// <reference path="../App/tenant_customizations/green_cleaners/components/recurrence-scheduler/recurrence-scheduler-config.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/schedule-simple-view/schedule-simple-view.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/schedule-simple-view/schedule-simple-view-config.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/models/eventinstance.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/models/scheduling-models.js" />
/// <reference path="../App/tenant_customizations/green_cleaners/Tests/appointment-recurrence-utils-tests.js" />
/// <reference path="../App/tenant_customizations/green_cleaners/utils/appointment-recurrence-utils.js" />
/// <reference path="../app/tenant_customizations/hfw/components/activity-selector/activity-selector.js" />
/// <reference path="../app/tenant_customizations/hfw/components/activity-selector/activity-selector-config.js" />
/// <reference path="../app/tenant_customizations/hfw/components/habit-plan-editor/habit-plan-editor.js" />
/// <reference path="../app/utils/luceneutils.js" />
/// <reference path="../app/utils/registerlocalfieldtypes.js" />
/// <reference path="../app/viewModels/dataformDesignerViewModel.js" />
/// <reference path="../app/viewModels/dataformFieldConfigViewModel.js" />
/// <reference path="../app/viewModels/dataformFieldsDesigner.js" />
/// <reference path="../app/viewModels/dataformLiveViewModel.js" />
/// <reference path="../app/viewModels/homeViewModel.js" />
/// <reference path="../app/viewmodels/managepaymentsviewmodel.js" />
/// <reference path="../bower_modules/bootstrap/dist/js/bootstrap.js" />
/// <reference path="../bower_modules/jquery/dist/jquery.js" />
/// <reference path="../bower_modules/jquery-ui/jquery-ui.js" />
/// <reference path="../bower_modules/jquery-validation/dist/jquery.validate.js" />
/// <reference path="../bower_modules/jquery-validation-unobtrusive/jquery.validate.unobtrusive.js" />
/// <reference path="../bower_modules/knockout.punches/knockout.punches.min.js" />
/// <reference path="../bower_modules/knockout/dist/knockout.js" />
/// <reference path="../bower_modules/knockout-kendo/build/knockout-kendo.min.js" />
/// <reference path="../bower_modules/knockout-postbox/build/knockout-postbox.min.js" />
/// <reference path="../bower_modules/knockout-sortable/build/knockout-sortable.min.js" />
/// <reference path="../bower_modules/knockout-validation/dist/knockout.validation.js" />
/// <reference path="../bower_modules/moment/moment.js" />
/// <reference path="../bower_modules/toastr/toastr.js" />
/// <reference path="../bower_modules/underscore/underscore.js" />
/// <reference path="../gulpfile.js" />
/// <reference path="../karma.conf.js" />
/// <reference path="../tests/field-tests.js" />
/// <reference path="../webpack.config.js" />
/// <reference path="js/build/admin-payment.bundle.js" />
/// <reference path="js/build/core.bundle.js" />
/// <reference path="js/build/dataform-designer.bundle.js" />
/// <reference path="js/build/dataform-live.bundle.js" />
/// <reference path="js/build/tests.bundle.js" />
/// <reference path="js/ko-extenders/knockout.extenders.moment.js" />
/// <reference path="js/ko-extenders/knockout.extenders.numeric.js" />
