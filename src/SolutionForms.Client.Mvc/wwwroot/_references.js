﻿/// <autosync enabled="true" />
/// <reference path="../app/bindings/datepicker.js" />
/// <reference path="../app/bindings/ko.bindings.bs-modal.js" />
/// <reference path="../app/bindings/ko.bindings.jq-autocomplete.js" />
/// <reference path="../app/bindings/ko.bindings.jq-payment.js" />
/// <reference path="../app/components/dataentry-form-view/dataentry-form-view.js" />
/// <reference path="../app/components/dataentry-table-view/dataentry-table-view.js" />
/// <reference path="../app/components/dataform-designer/dataform-designer.js" />
/// <reference path="../app/components/dataform-fields-designer/dataform-fields-designer.js" />
/// <reference path="../app/components/dataform-live/dataform-live.js" />
/// <reference path="../app/components/dynamic-form-ui/dynamic-form-ui.js" />
/// <reference path="../app/components/field-controls/bootstrap-grid-layout/bootstrap-grid-layout.js" />
/// <reference path="../app/components/field-controls/bootstrap-grid-layout/bootstrap-grid-layout-config.js" />
/// <reference path="../app/components/field-controls/checkboxes-field/checkboxes-field.js" />
/// <reference path="../app/components/field-controls/checkboxes-field/checkboxes-field-config.js" />
/// <reference path="../app/components/field-controls/date-field/date-field.js" />
/// <reference path="../app/components/field-controls/date-field/date-field-config.js" />
/// <reference path="../app/components/field-controls/hidden-field/hidden-field.js" />
/// <reference path="../app/components/field-controls/lookup-field/lookup-field.js" />
/// <reference path="../app/components/field-controls/lookup-field/lookup-field-config.js" />
/// <reference path="../app/components/field-controls/paragraph-text-field/paragraph-text-field.js" />
/// <reference path="../app/components/field-controls/repeater-field/repeater-field.js" />
/// <reference path="../app/components/field-controls/repeater-field/repeater-field-config.js" />
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
/// <reference path="../App/lib/knockout-projections.js" />
/// <reference path="../app/lib/kolite-local/knockout.activity.js" />
/// <reference path="../app/lib/kolite-local/knockout.command.js" />
/// <reference path="../app/lib/kolite-local/knockout.dirtyFlag.js" />
/// <reference path="../app/lib/printThis/printThis.js" />
/// <reference path="../app/Models/formFieldDesigner.js" />
/// <reference path="../app/Models/formFieldLive.js" />
/// <reference path="../app/Models/PaymentInfo.js" />
/// <reference path="../app/plugins/getDataFromLocalStorePlugin.js" />
/// <reference path="../app/plugins/initializeFormValuesPlugin.js" />
/// <reference path="../app/plugins/saveToLocalDocumentStorePlugin.js" />
/// <reference path="../App/services/dataEntriesService.js" />
/// <reference path="../app/services/dataFormsService.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/appointment-editor/appointment-editor.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/appointments-controller/appointments-controller.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/daily-appointment-report/daily-appointment-report.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/recurrence-scheduler/recurrence-scheduler.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/recurrence-scheduler/recurrence-scheduler-config.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/schedule-simple-view/schedule-simple-view.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/components/schedule-simple-view/schedule-simple-view-config.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/models/EventInstance.js" />
/// <reference path="../app/tenant_customizations/green_cleaners/models/scheduling-models.js" />
/// <reference path="../App/tenant_customizations/green_cleaners/Tests/appointment-recurrence-utils-tests.js" />
/// <reference path="../App/tenant_customizations/green_cleaners/utils/appointment-recurrence-utils.js" />
/// <reference path="../App/tenant_customizations/hfw/components/activity-selector/activity-selector.js" />
/// <reference path="../App/tenant_customizations/hfw/components/activity-selector/activity-selector-config.js" />
/// <reference path="../App/tenant_customizations/hfw/components/all-client-activity-overview/all-client-activity-overview.js" />
/// <reference path="../App/tenant_customizations/hfw/components/all-client-activity-overview/all-client-activity-overview-config.js" />
/// <reference path="../App/tenant_customizations/hfw/components/client-habit-assignment/client-habit-assignment.js" />
/// <reference path="../App/tenant_customizations/hfw/components/client-habits/client-habits.js" />
/// <reference path="../App/tenant_customizations/hfw/components/client-habits/client-habits-config.js" />
/// <reference path="../App/tenant_customizations/hfw/components/habit-log-entry/habit-log-entry.js" />
/// <reference path="../App/tenant_customizations/hfw/components/habit-log-entry/habit-log-entry-config.js" />
/// <reference path="../App/utils/luceneUtils.js" />
/// <reference path="../App/utils/registerLocalFieldTypes.js" />
/// <reference path="../App/viewModels/dataformDesignerViewModel.js" />
/// <reference path="../App/viewModels/dataformFieldConfigViewModel.js" />
/// <reference path="../App/viewModels/dataformFieldsDesigner.js" />
/// <reference path="../App/viewModels/dataformLiveViewModel.js" />
/// <reference path="../App/viewModels/homeViewModel.js" />
/// <reference path="../App/viewModels/managePaymentsViewModel.js" />
/// <reference path="../gulpfile.js" />
/// <reference path="../karma.conf.js" />
/// <reference path="../Tests/field-tests.js" />
/// <reference path="../webpack.config.js" />
/// <reference path="js/build/admin-payment.bundle.js" />
/// <reference path="js/build/core.bundle.js" />
/// <reference path="js/build/dataform-designer.bundle.js" />
/// <reference path="js/build/dataform-designer.bundle-win-18fleptqnpc.js" />
/// <reference path="js/build/dataform-live.bundle.js" />
/// <reference path="js/build/dataform-live.bundle-win-18fleptqnpc.js" />
/// <reference path="js/ko-extenders/knockout.extenders.moment.js" />
/// <reference path="js/ko-extenders/knockout.extenders.numeric.js" />
/// <reference path="js/lib/jquery.validate.js" />
