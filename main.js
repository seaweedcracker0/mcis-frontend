angular.module('MCIS', []).
    directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    }
                    reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        }
    }]).
    directive('validFile', function () {
        return {
            restrict: 'A',
            require: "ngModel",
            scope: {
                extension: '=',
                size: '=',
                custom: '='
            },
            link: function (scope, el, attrs, ngModel) {
                //change event is fired when file is selected
                el.bind('change', function () {
                    scope.$apply(function () {
                        var files = el[0].files[0];
                        var fileSize = ((files.size / 1024) / 1024).toFixed(4);
                        var fileExt = files.name.slice((files.name.lastIndexOf(".") - 1 >>> 0) + 2);
                        fileExt = fileExt.toLowerCase();
                        var extensions = scope.extension ? scope.extension.split(',') : [];

                        // Convert all format string to Lower case and compare.
                        if (extensions.length > 0) {
                            for (i = 0; i < extensions.length; i++) {
                                extensions[i] = extensions[i].toLowerCase();
                            }
                        }

                        ngModel.$setViewValue(files);
                        ngModel.$setValidity('size', true);
                        ngModel.$setValidity('format', true);

                        if (parseInt(scope.size) && parseInt(fileSize) > parseInt(scope.size)) {
                            ngModel.$setValidity('size', false);
                            ngModel.$setTouched();
                            ngModel.$setViewValue('');
                        }
                        // console.log(extensions, fileExt)
                        if (scope.extension && extensions.indexOf(fileExt) == -1) {
                            ngModel.$setValidity('format', false);
                            ngModel.$setTouched();
                            ngModel.$setViewValue('');
                        }
                        if (custom) {
                            ngModel.$setValidity('size', null);
                            ngModel.$setValidity('format', null);
                            ngModel.$setViewValue('');
                        }

                        ngModel.$render();
                    });

                    // el.val(null)
                });
            }
        }
    }).  
    directive('dropzone', ['$http', function ($http) {
        return {
            restrict: 'A',
            replace: true,
            scope: false,
            link: function (scope, element, attrs, ngModel) {
                // console.log("HOHO", scope.multiStepForm[attrs.inputBinding], scope.formParams)
                element.on('dragover', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                element.on('dragenter', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                element.on('drop', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.originalEvent) {
                        e = e.originalEvent
                    }
                    if (e.dataTransfer) {
                        if (e.dataTransfer.files.length > 0) {
                            let elem = scope.multiStepForm[attrs.inputBinding].$$element[0]
                            var files = e.dataTransfer.files[0];
                            var fileSize = ((files.size / 1024) / 1024).toFixed(4);
                            var fileExt = files.name.slice((files.name.lastIndexOf(".") - 1 >>> 0) + 2);
                            fileExt = fileExt.toLowerCase();
                            var extensions = elem.dataset?.extension ? elem.dataset?.extension.split(',') : [];
                            var size = elem.dataset?.size;

                            // Convert all format string to Lower case and compare.
                            if (extensions.length > 0) {
                                for (i = 0; i < extensions.length; i++) {
                                    extensions[i] = extensions[i].toLowerCase();
                                }
                            }
                            console.log(size, fileSize)
                            if (size && parseInt(fileSize) > parseInt(size)) {
                                alert("Please upload file size that is less than 10mb.");
                            }
                            else if (extensions && extensions.indexOf(fileExt) == -1) {
                                alert("Invalid file format. Please upload in PNG, JPG or JPEG format only.");
                            }
                            else {
                                scope.formParams[attrs.inputBinding] = e.dataTransfer.files[0];
                                scope.$apply()
                            }
                        }
                    }
                    return false;
                });
            }
        };
    }]).
    controller('formController', function ($scope, $http, $timeout) {
        $scope.formParams = {};
        $scope.stage = "stage1";
        $scope.section = "section1";
        $scope.apiEndPoint = "";
        $scope.stagePolicy = false;
        $scope.stagePdpa = false;
        $scope.esignInit = false;
        $scope.applicantEsignInit = false;
        $scope.currDate = new Date().getTime();
        $scope.currDateObj = new Date();
        $scope.skipEmploymentHistory = false;
        $scope.skipContracted = false;
        var inputMin = 12;

        $scope.nricYear = []
        $scope.yearList = []
        $scope.years = []

        let years18BeforeNow = ($scope.currDateObj.getFullYear() - 18)
        for (let i = 0; (i < 100 - 18); i++) {
            $scope.nricYear.push(years18BeforeNow - i);
        }

        for (let i = 0; i < 100; i++) {
            $scope.yearList.push($scope.currDateObj.getFullYear() - i)
        }
        for (let i = 0; i > -1; i++) {
            let year = $scope.currDateObj.getFullYear() - i
            // console.log(year, i)
            if (year == 1999) {
                break;
            }
            else {
                $scope.years.push(year)
            }
        }

        $scope.signaturePadObj = {}

        $timeout(function () {
            $scope.formParams.primaryHandphoneNo = '01'
            $scope.formParams.secondaryHandphoneNo = '01'

            var currentDate = moment(moment(), 'YYMMDD');
            $scope.formParams.cffDeclareDate = currentDate.format('DD');
            $scope.formParams.cffDeclareMonth = currentDate.format('MM');
            $scope.formParams.cffDeclareYear = currentDate.format('YYYY');
        })        

        $scope.triggerModal = function () {
            $scope.formParams.esignFile = null
            $scope.formParams.esignFileUpload = null
            if ($scope.signaturePadObj['signature-pad']) {
                $scope.clearSignaturePad('signature-pad')
            }
            $('#esign-modal').on('shown.bs.modal', function () {
                if (!$scope.esignInit) {
                    $scope.esignInit = true
                    $scope.init("signature-pad");
                }
            })
            $('#esign-modal').modal({ show: true })
        }

        $scope.triggerApplicantModal = function () {
            $scope.formParams.applicantEsigndraw = null
            $scope.formParams.applicantEsigndrawUpload = null
            if ($scope.signaturePadObj['applicant-signature-pad']) {
                $scope.clearSignaturePad('applicant-signature-pad')
            }
            $('#applicant-esign-modal').on('shown.bs.modal', function () {
                if (!$scope.applicantEsignInit) {
                    $scope.applicantEsignInit = true
                    $scope.init("applicant-signature-pad");
                }
            })
            $('#applicant-esign-modal').modal({ show: true })
        }

        $scope.init = function (id) {
            $scope.initSignaturePad(id);
        }

        $scope.stagePolicyFn = function () {
            $scope.stagePolicy = true;
        }

        $scope.goBackPdpaFn = function () {
            $scope.stagePolicy = false;
        }

        $scope.stagePdpaFn = function () {
            $scope.stagePdpa = true;
        }

        $scope.goBackLandingFn = function () {
            $scope.stagePdpa = false;
        }

        $scope.validateCitizen = function(value, obj) {
            if(value == '0'){
              obj.$setValidity("notCitizen", false);
            }else{
              obj.$setValidity("notCitizen", true);
            }
        }

        $scope.nextSection = function (section) {
            console.log('section: ', section);
            $scope.formValidation = true;
            console.log($scope.multiStepForm, $scope.formParams)
            console.log($scope.multiStepForm.$valid);
  
            if (section == 'section6') {
                $scope.updateDate('pcePcilCert', $scope.multiStepForm.pcePcilCertDate, $scope.multiStepForm.pcePcilCertMonth, $scope.multiStepForm.pcePcilCertYear);
                $scope.updateDateOptional('ceilliCert', $scope.multiStepForm.ceilliCertDate, $scope.multiStepForm.ceilliCertMonth, $scope.multiStepForm.ceilliCertYear, $scope.multiStepForm.ceilli.$viewValue);
                $scope.updateDateOptional('bamcCert', $scope.multiStepForm.bamcCertDate, $scope.multiStepForm.bamcCertMonth, $scope.multiStepForm.bamcCertYear, $scope.multiStepForm.bamc.$viewValue);
                $scope.updateDateOptional('rfpCert', $scope.multiStepForm.rfpCertDate, $scope.multiStepForm.rfpCertMonth, $scope.multiStepForm.rfpCertYear, $scope.multiStepForm.rfp.$viewValue);
                $scope.updateDateOptional('othersCert', $scope.multiStepForm.othersCertDate, $scope.multiStepForm.othersCertMonth, $scope.multiStepForm.othersCertYear, $scope.multiStepForm.others.$viewValue);
            }
  
            console.log('section', section);
            console.log('skipEmploymentHistory', !$scope.skipEmploymentHistory);

            if (section == 'section8' && !$scope.skipEmploymentHistory) {                
                $scope.updateMonthYear('eh1EmploymentPeriodFrom', 'eh1EmploymentPeriodTo');
                // $scope.updateMonthYear('eh2EmploymentPeriodFrom', 'eh2EmploymentPeriodTo');
                // $scope.updateMonthYear('eh3EmploymentPeriodFrom', 'eh3EmploymentPeriodTo');
            }
  
            if (section == 'section13') {
                $scope.updateDateOptional('moveAgent', $scope.multiStepForm.moveAgentDate, $scope.multiStepForm.moveAgentMonth, $scope.multiStepForm.moveAgentYear, $scope.multiStepForm.moveAgentDate.$viewValue);
                $scope.updateDateOptional('moveAgent', $scope.multiStepForm.moveAgentDate, $scope.multiStepForm.moveAgentMonth, $scope.multiStepForm.moveAgentYear, $scope.multiStepForm.moveAgentMonth.$viewValue);
                $scope.updateDateOptional('moveAgent', $scope.multiStepForm.moveAgentDate, $scope.multiStepForm.moveAgentMonth, $scope.multiStepForm.moveAgentYear, $scope.multiStepForm.moveAgentYear.$viewValue);
            }

            if (section == 'section14') {
                $scope.textChangedOptional($scope.formParams.nomineeGroupNRIC1, 'nomination', $scope.multiStepForm.nomineeGroupNRIC1, $scope.multiStepForm.groupBenefit.$viewValue);
                $scope.textChangedOptional($scope.formParams.nomineeGroupNRIC2, 'nomination', $scope.multiStepForm.nomineeGroupNRIC2, $scope.multiStepForm.groupBenefit.$viewValue);
                $scope.textChangedOptional($scope.formParams.nomineeGroupNRIC3, 'nomination', $scope.multiStepForm.nomineeGroupNRIC3, $scope.multiStepForm.groupBenefit.$viewValue);
                $scope.textChangedOptional($scope.formParams.nomineeGroupNRIC4, 'nomination', $scope.multiStepForm.nomineeGroupNRIC4, $scope.multiStepForm.groupBenefit.$viewValue);
                $scope.textChangedOptional($scope.formParams.nomineeAgencyNRIC, 'nomination', $scope.multiStepForm.nomineeAgencyNRIC, $scope.multiStepForm.agencyBenefit.$viewValue);
                $scope.textChangedOptional($scope.formParams.nomineeCommissionNRIC, 'nomination', $scope.multiStepForm.nomineeCommissionNRIC, $scope.multiStepForm.commission.$viewValue);
            }

              
            if ($scope.multiStepForm.$valid) {
                $scope.direction = 1;
                $scope.section = section;
                $scope.formValidation = false;
            }
        }

        $scope.backSection = function (section) {
            $scope.direction = 0;
            $scope.section = section;

            angular.forEach($scope.multiStepForm.$$controls, (field) => {
                //Touch the field first
                if (field.$$element[0].type == 'file') {                    
                    field.$setValidity('format', null);
                    field.$setValidity('size', null);
                }
            });
        }

        // Navigation functions
        $scope.nextStep = function (stage) {            
            $scope.formValidation = true;

            if (stage == 'stage5') {
                $scope.updateDateOptional('moveAgent', $scope.multiStepForm.moveAgentDate, $scope.multiStepForm.moveAgentMonth, $scope.multiStepForm.moveAgentYear, $scope.multiStepForm.moveAgentDate.$viewValue);
                $scope.updateDateOptional('moveAgent', $scope.multiStepForm.moveAgentDate, $scope.multiStepForm.moveAgentMonth, $scope.multiStepForm.moveAgentYear, $scope.multiStepForm.moveAgentMonth.$viewValue);
                $scope.updateDateOptional('moveAgent', $scope.multiStepForm.moveAgentDate, $scope.multiStepForm.moveAgentMonth, $scope.multiStepForm.moveAgentYear, $scope.multiStepForm.moveAgentYear.$viewValue);
            }

            if ($scope.multiStepForm.$valid) {
                $scope.direction = 1;
                $scope.stage = stage;
                $scope.formValidation = false;
            }
        };

        $scope.backStep = function (stage) {
            $scope.direction = 0;
            $scope.stage = stage;
        };

        $scope.triggerSubmit = function () {
            $("#multiStepForm").submit()
        }

        $scope.submitForm = function (e) {
            // var wsUrl = "http://localhost:8080/iweb-manager/user/ERecruit-Test-Page.html";
            $scope.formValidation = true;

            // Check form validity and submit data using $http
            if (!$scope.multiStepForm.$valid) {
                e.preventDefault()
            }
        }

        $scope.signhere = function () {
            var sign = document.getElementById("esign-modal");
            sign.classList.add('show');
        }

        $scope.signdone = function () {
            $('#esign-modal').modal('hide');
        }

        // $scope.closeModal = function () {
        //     var sign = document.getElementById("esign-modal");
        //     sign.classList.remove('show');
        // }

        $scope.reset = function () {
            // Clean up scope before destorying
            $scope.formParams = {};
            $scope.stage = "";
        }

        $scope.textChanged = function (value, type, obj) {
            if (type == 'personal') {
                obj.$setValidity("notYet18", true);
                obj.$setValidity("dateinvalid", true);
                if (value?.length >= inputMin) $scope.getICInfo(value, obj);
            } else if (type == 'spouse') {
                obj.$setValidity("dateinvalid", true);
                if (value?.length >= inputMin) $scope.getSpouseICInfo(value, obj);
            } else if (type == 'nomination') {
                obj.$setValidity("notYet18", true);
                obj.$setValidity("dateinvalid", true);
                if (value?.length >= inputMin) $scope.getNominationInfo(value, obj);
            } else if (type == 'phone') {
                obj.$setValidity("prefixNot0", true);
                if (value) $scope.checkPrefix(value, obj);
            }
        };
        
        $scope.textChangedOptional = function (value, type, obj, option) {
            if (option) {
                if (value != '') {
                    if (type == 'nomination') {
                        obj.$setValidity("notYet18", true);
                        obj.$setValidity("dateinvalid", true);
                        if (value?.length >= inputMin) $scope.getNominationInfo(value, obj);
                    }
                }else {
                    obj.$setValidity("notYet18", null);
                    obj.$setValidity("dateinvalid", null);
                }
            }
        };

        $scope.checkPrefix = function (prefix, obj) {
            if (prefix[0] != "0") {
                obj.$setValidity("prefixNot0", false);
            }
        }

        $scope.getICInfo = function (nric, obj) {
            $scope.formParams.gender = Number(nric.substring(11, 12)) % 2 == 0 ? 'F' : 'M';
            var dob = moment(nric.substring(0, 6), 'YYMMDD');
            if (dob.isValid() && dob.isAfter(moment())) {
                dob.subtract(100, 'years');
            }

            if (dob.isValid()) {
                let year = dob.format('YYYY');
                if (($scope.currDateObj.getFullYear() - 18) >= Number.parseInt(year)) {
                    $scope.formParams.personalDobDate = dob.format('DD');
                    $scope.formParams.personalDobMonth = dob.format('MM');
                    $scope.formParams.personalDobYear = year;
                }
                else {
                    obj.$setValidity("notYet18", false);
                }
            }else {
                obj.$setValidity("dateinvalid", false);
            }
        }

        $scope.getSpouseICInfo = function (nric, obj) {
            var dob = moment(nric.substring(0, 6), 'YYMMDD');
            if (dob.isValid() && dob.isAfter(moment())) {
                dob.subtract(100, 'years');
            }

            if (dob.isValid()) {
                console.log(dob);
                $scope.formParams.spouseDobDate = dob.format('DD');
                $scope.formParams.spouseDobMonth = dob.format('MM');
                $scope.formParams.spouseDobYear = dob.format('YYYY');
            }else {
                obj.$setValidity("dateinvalid", false);
            }
        }

        $scope.getNominationInfo = function (nric, obj) {
            var dob = moment(nric.substring(0, 6), 'YYMMDD');
            if (dob.isValid() && dob.isAfter(moment())) {
                dob.subtract(100, 'years');
            }

            if (dob.isValid()) {
                let year = dob.format('YYYY');
                if (($scope.currDateObj.getFullYear() - 18) >= Number.parseInt(year)) {
                  
                }else {
                    obj.$setValidity("notYet18", false);
                }
            }else {
              obj.$setValidity("dateinvalid", false);
            }
        }

        $scope.initSignaturePad = function (id) {
            var wrapper = document.getElementById(id);
            var wrapper2 = document.getElementById("esign-modal");
            var clearButton = wrapper.querySelector("[data-action=clear]");
            var confirmButton = wrapper2.querySelector("[data-action=confirm]");
            var canvas = wrapper.querySelector("canvas");
            var signaturePad = new SignaturePad(canvas, {
                // It's Necessary to use an opaque color when saving image as JPEG;
                // this option can be omitted if only saving as PNG or SVG
                backgroundColor: 'rgb(220, 220, 220)',
            });

            // Adjust canvas coordinate space taking into account pixel ratio,
            // to make it look crisp on mobile devices.
            // This also causes canvas to be cleared.
            function resizeCanvas() {
                // When zoomed out to less than 100%, for some very strange reason,
                // some browsers report devicePixelRatio as less than 1
                // and only part of the canvas is cleared then.
                var ratio = Math.max(window.devicePixelRatio || 1, 1);

                // This part causes the canvas to be cleared
                // console.log(canvas.width)
                canvas.width = wrapper.querySelector(".signature-pad--body").offsetWidth * ratio;
                // console.log(canvas.height)
                canvas.height = (wrapper.querySelector(".signature-pad--body").offsetHeight - 5) * ratio;
                canvas.getContext("2d").scale(ratio, ratio);

                // This library does not listen for canvas changes, so after the canvas is automatically
                // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
                // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
                // that the state of this library is consistent with visual state of the canvas, you
                // have to clear it manually.
                signaturePad.clear();
            }

            // On mobile devices it might make more sense to listen to orientation change,
            // rather than window resize events.
            window.onresize = resizeCanvas;
            resizeCanvas();

            function download(dataURL, filename) {
                if (navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") === -1) {
                    window.open(dataURL);
                } else {
                    var blob = dataURLToBlob(dataURL);
                    var url = window.URL.createObjectURL(blob);

                    var a = document.createElement("a");
                    a.style = "display: none";
                    a.href = url;
                    a.download = filename;

                    document.body.appendChild(a);
                    a.click();

                    window.URL.revokeObjectURL(url);
                }
            }

            // One could simply use Canvas#toBlob method instead, but it's just to show
            // that it can be done using result of SignaturePad#toDataURL.
            function dataURLToBlob(dataURL) {
                // Code taken from https://github.com/ebidel/filer.js
                var parts = dataURL.split(';base64,');
                var contentType = parts[0].split(":")[1];
                var raw = window.atob(parts[1]);
                var rawLength = raw.length;
                var uInt8Array = new Uint8Array(rawLength);

                for (var i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }

                return new Blob([uInt8Array], { type: contentType });
            }

            $scope.DataURIToBlob = function (dataURI) {
                const splitDataURI = dataURI.split(',')
                const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
                const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

                const ia = new Uint8Array(byteString.length)
                for (let i = 0; i < byteString.length; i++)
                    ia[i] = byteString.charCodeAt(i)

                return new Blob([ia], { type: mimeString })
            }

            $scope.signaturePadObj[id] = signaturePad

            // clearButton.addEventListener("click", function (event) {
            //     signaturePad.clear();
            // });

            // confirmButton.addEventListener("click", function (event) {
            //     $scope.formModalValidation = true;

            //     if ($scope.subForm.$valid) {
            //         if ($scope.formParams.esignFile || !signaturePad.isEmpty()) {
            //             if(!$scope.formParams.esignFile) {
            //                 var dataURL = signaturePad.toDataURL();
            //                 $scope.formParams.esignFile = DataURIToBlob(dataURL);
            //                 console.log(DataURIToBlob(dataURL))
            //                 $scope.$apply()
            //             }
            //             $scope.signdone();
            //             $scope.formModalValidation = false;    
            //         } else {            
            //             alert("Please provide your signature.");
            //         }
            //     }

            //     $scope.$apply();
            // })
        }

        $scope.clearSignaturePad = function (id) {
            $scope.signaturePadObj[id].clear()
        }

        $scope.toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        $scope.confirmESign = function (id) {
            if (id == 'signature-pad') {
                $scope.formModalValidation = true;
                if ($scope.subForm.$valid) {
                    if ($scope.formParams.esignFileUpload || !$scope.signaturePadObj[id].isEmpty()) {
                        var dataUrl
                        if ($scope.formParams.esignFileUpload) {
                            $scope.toBase64($scope.formParams.esignFileUpload).then((fileContent) => {
                                dataUrl = fileContent

                                $scope.formParams.esignFile = dataUrl;
        
                                $timeout(function () {
                                    $scope.signdone();
                                    $scope.formModalValidation = false;
                                    $scope.formParams.esignFileUpload = null;
                                })
                            })
                        }
                        else {
                            dataUrl = $scope.signaturePadObj[id].toDataURL();
                            $scope.formParams.esignFile = dataUrl;
        
                            $timeout(function () {
                                $scope.signdone();
                                $scope.formModalValidation = false;
                                $scope.formParams.esignFileUpload = null;
                            })
                        }
                    } else {
                        alert("Please provide your signature.");
                    }
                }
            }
            else {
                if ($scope.formParams.applicantEsigndrawUpload || !$scope.signaturePadObj[id].isEmpty()) {
                    var dataUrl
                    if ($scope.formParams.applicantEsigndrawUpload) {
                        $scope.toBase64($scope.formParams.applicantEsigndrawUpload).then((fileContent) => {
                            dataUrl = fileContent

                            $scope.formParams.applicantEsigndraw = dataUrl;
                            $timeout(function () {
                                $scope.triggerSubmit()
                            })
                        })
                    }
                    else {
                        dataUrl = $scope.signaturePadObj[id].toDataURL();
                        $scope.formParams.applicantEsigndraw = dataUrl;
                        $timeout(function () {
                            $scope.triggerSubmit()
                        })
                    }
                } else {
                    alert("Please provide your signature.");
                }
            }
        }

        $scope.fileUploaded = function (ev) {
            // console.log(ev)
            let elem = ev.target
            var files = elem.files[0];
            var fileSize = ((files.size / 1024) / 1024).toFixed(4);
            var fileExt = files.name.slice((files.name.lastIndexOf(".") - 1 >>> 0) + 2);
            fileExt = fileExt.toLowerCase();
            var extensions = elem.dataset?.extension ? elem.dataset?.extension.split(',') : [];
            var size = elem.dataset?.size;

            // Convert all format string to Lower case and compare.
            if (extensions.length > 0) {
                for (i = 0; i < extensions.length; i++) {
                    extensions[i] = extensions[i].toLowerCase();
                }
            }
            console.log(size, fileSize)
            if (size && parseInt(fileSize) > parseInt(size)) {
                alert("Please upload file size that is less than 10mb.");
            }
            else if (extensions && extensions.indexOf(fileExt) == -1) {
                alert("Invalid file format. Please upload in PNG, JPG or JPEG format only.");
            }
            else {
                $scope.formParams[ev.target.name] = ev.target.files[0]
                $scope.$apply()
            }
        }

        $scope.noEmployed = function () {
            $scope.skipEmploymentHistory = true
            $scope.nextSection('section8')
        }

        $scope.goBackHealthInfo = function () {
            if ($scope.skipEmploymentHistory) {
                $scope.skipEmploymentHistory = false
                $scope.backSection('section6')
            } else {
                $scope.backSection('section7')
            }
        }

        $scope.noContractInsurer = function () {
            $scope.skipContracted = true
            $scope.nextStep('stage5');
            $scope.nextSection('section13')
        }

        $scope.goBackNomination = function () {
            if ($scope.skipContracted) {
                console.log("come here")
                $scope.skipContracted = false
                $scope.backStep('stage4');
                $scope.backSection('section11')
            } else {
                $scope.backStep('stage4');
                $scope.backSection('section12')
            }
        }

        $scope.clearChecked = function (val, label) {
            $timeout(() => {
                if (val) {
                    $scope.multiStepForm[label + "CertDate"].$setValidity('datevalid', null);
                    $scope.multiStepForm[label + "CertMonth"].$setValidity('datevalid', null);
                    $scope.multiStepForm[label + "CertYear"].$setValidity('datevalid', null);
                    
                    $scope.multiStepForm[label + "CertDate"].$setViewValue("");
                    $scope.formParams[label + "CertDate"] = ""
                    $("#" + label + "CertDate").val("")

                    $scope.multiStepForm[label + "CertMonth"].$setViewValue("");
                    $scope.formParams[label + "CertMonth"] = ""
                    $("#" + label + "CertMonth").val("")

                    $scope.multiStepForm[label + "CertYear"].$setViewValue("");
                    $scope.formParams[label + "CertYear"] = ""
                    $("#" + label + "CertYear").val("")

                    if ($("#" + label + "Qualifications").length > 0) {
                        $scope.multiStepForm[label + "Qualifications"].$setViewValue("")
                        $scope.formParams[label + "Qualifications"] = ""
                        $("#" + label + "Qualifications").val("")
                    }

                    $scope.multiStepForm[label + "Cert"].$setValidity('format', null);
                    $scope.multiStepForm[label + "Cert"].$setValidity('size', null);
                }
            })
        }

        $scope.clearNominationChecked = function (val, label) {
            $timeout(() => {
                if (val) {                  
                    $scope.multiStepForm[label + "ApplicantICCopy"].$setValidity('format', null);
                    $scope.multiStepForm[label + "ApplicantICCopy"].$setValidity('size', null);
                    $scope.multiStepForm[label + "ApplicantICCopy"].$setViewValue("");
                    $scope.multiStepForm[label + "ICCopy"].$setValidity('format', null);
                    $scope.multiStepForm[label + "ICCopy"].$setValidity('size', null);                    
                    $scope.multiStepForm[label + "ICCopy"].$setViewValue("");
                }
            })
        }

        $scope.updateDate = function(name, obj1, obj2, obj3) {
            var dateChecking = $scope.formParams[name + 'Date'] + $scope.formParams[name + 'Month'] + $scope.formParams[name + 'Year'];
            var dob = moment(dateChecking, 'DDMMYYYY');
            if (!dob.isValid() || dob.isAfter(moment())){
                console.log('datevalid', 'false');
                obj1.$setValidity('datevalid', false);
                obj1.$setTouched();
                obj2.$setValidity('datevalid', false);
                obj2.$setTouched();
                obj3.$setValidity('datevalid', false);
                obj3.$setTouched();
            }else {
                obj1.$setValidity('datevalid', null);
                obj2.$setValidity('datevalid', null);
                obj3.$setValidity('datevalid', null);
            }
        }

        $scope.updateDateOptional = function(name, obj1, obj2, obj3, option) {
            if (option) {
                var dateChecking = $scope.formParams[name + 'Date'] + $scope.formParams[name + 'Month'] + $scope.formParams[name + 'Year'];
                console.log('dateChecking..',dateChecking);
                var dob = moment(dateChecking, 'DDMMYYYY');
                if (!dob.isValid() || dob.isAfter(moment())){
                    console.log('datevalid', 'false');
                    obj1.$setValidity('datevalid', false);
                    obj1.$setTouched();
                    obj2.$setValidity('datevalid', false);
                    obj2.$setTouched();
                    obj3.$setValidity('datevalid', false);
                    obj3.$setTouched();
                }else {
                    obj1.$setValidity('datevalid', null);
                    obj2.$setValidity('datevalid', null);
                    obj3.$setValidity('datevalid', null);
                }
            }else {
                obj1.$setValidity('datevalid', null);
                obj2.$setValidity('datevalid', null);
                obj3.$setValidity('datevalid', null);
            }          
        }

        $scope.updateMonthYear = function(from, to) {
            var fromDateChecking = $scope.formParams[from + 'Month'] + $scope.formParams[from + 'Year'];
            var toDateChecking = $scope.formParams[to + 'Month'] + $scope.formParams[to + 'Year'];
            var fromDob = moment(fromDateChecking, 'MMYYYY');
            var toDob = moment(toDateChecking, 'MMYYYY');

            $scope.multiStepForm[from + 'Month'].$setValidity('datevalid', true);
            $scope.multiStepForm[from + 'Month'].$setTouched();
            $scope.multiStepForm[from + 'Year'].$setValidity('datevalid', true);
            $scope.multiStepForm[from + 'Year'].$setTouched();

            $scope.multiStepForm[to + 'Month'].$setValidity('datevalid', true);
            $scope.multiStepForm[to + 'Month'].$setTouched();
            $scope.multiStepForm[to + 'Year'].$setValidity('datevalid', true);
            $scope.multiStepForm[to + 'Year'].$setTouched();

            $scope.multiStepForm[from + 'Month'].$setValidity('daterange', true);
            $scope.multiStepForm[from + 'Month'].$setTouched();
            $scope.multiStepForm[from + 'Year'].$setValidity('daterange', true);
            $scope.multiStepForm[from + 'Year'].$setTouched();
            $scope.multiStepForm[to + 'Month'].$setValidity('daterange', true);
            $scope.multiStepForm[to + 'Month'].$setTouched();
            $scope.multiStepForm[to + 'Year'].$setValidity('daterange', true);
            $scope.multiStepForm[to + 'Year'].$setTouched();

            if (!fromDob.isValid() || fromDob.isAfter(moment())){
                $scope.multiStepForm[from + 'Month'].$setValidity('datevalid', false);
                $scope.multiStepForm[from + 'Month'].$setTouched();
                $scope.multiStepForm[from + 'Year'].$setValidity('datevalid', false);
                $scope.multiStepForm[from + 'Year'].$setTouched();
            }

            if (!toDob.isValid() || toDob.isAfter(moment())){
                $scope.multiStepForm[to + 'Month'].$setValidity('datevalid', false);
                $scope.multiStepForm[to + 'Month'].$setTouched();
                $scope.multiStepForm[to + 'Year'].$setValidity('datevalid', false);
                $scope.multiStepForm[to + 'Year'].$setTouched();
            }

            if (fromDob.isValid() && toDob.isValid()) {
                var mStart = moment(fromDob);
                var mEnd = moment(toDob);
                if (mStart.isAfter(mEnd)) {
                    $scope.multiStepForm[from + 'Month'].$setValidity('daterange', false);
                    $scope.multiStepForm[from + 'Month'].$setTouched();
                    $scope.multiStepForm[from + 'Year'].$setValidity('daterange', false);
                    $scope.multiStepForm[from + 'Year'].$setTouched();
                    $scope.multiStepForm[to + 'Month'].$setValidity('daterange', false);
                    $scope.multiStepForm[to + 'Month'].$setTouched();
                    $scope.multiStepForm[to + 'Year'].$setValidity('daterange', false);
                    $scope.multiStepForm[to + 'Year'].$setTouched();
                }
            }
        }
    });