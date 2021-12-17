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
directive('validFile',function(){
return {
    require:'ngModel',
    link:function(scope,el,attrs,ngModel){
    //change event is fired when file is selected
    el.bind('change',function(){
        scope.$apply(function(){
        ngModel.$setViewValue(el.val());
        ngModel.$render();
        });
    });
    }
}
}).
controller('formController', function($scope, $http) {
$scope.formParams = {};
$scope.stage = "stage1";
$scope.section = "section1";
$scope.apiEndPoint = "";
$scope.stagePolicy = false;
$scope.esignInit = false;
$scope.currDate = new Date().getTime()
var inputMin = 12;

$scope.triggerModal = function() {
    $('#esign-modal').on('shown.bs.modal', function () {
        if(!$scope.esignInit) {
            $scope.init();
        }
    })
    $('#esign-modal').modal({show: true})
}

$scope.init = function() {
    $scope.initSignaturePad();
}

$scope.stagePolicyFn = function() {
    $scope.stagePolicy = true;
}

$scope.nextSection = function(section) {
    $scope.formValidation = true;

    if ($scope.multiStepForm.$valid) {
        $scope.direction = 1;
        $scope.section = section;
        $scope.formValidation = false;
    }
}

$scope.backSection = function(section) {
    $scope.direction = 0;
    $scope.section = section;
}

// Navigation functions
$scope.nextStep = function (stage) {
//$scope.direction = 1;
//$scope.stage = stage;

$scope.formValidation = true;

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
    $scope.closeModal()
}

$scope.closeModal = function () {
    var sign = document.getElementById("esign-modal");
    sign.classList.remove('show');
}

$scope.reset = function() {
// Clean up scope before destorying
$scope.formParams = {};
$scope.stage = "";
}

$scope.textChanged = function(nric, type) {
    if (type == 'personal'){
        if (nric.length >= inputMin) $scope.getICInfo(nric);
    }else if (type == 'spouse'){
        if (nric.length >= inputMin) $scope.getSpouseICInfo(nric);
    }
};

$scope.getICInfo = function(nric) {
    $scope.formParams.gender = Number(nric.substring(11, 12)) % 2 == 0 ? 'F' : 'M';
    var dob = moment(nric.substring(0, 6), 'YYMMDD');
    if (dob.isValid() && dob.isAfter(moment())) {
        dob.subtract(100, 'years');
    }

    if (dob.isValid()){
        console.log(dob);
        $scope.formParams.personalDobDate = dob.format('DD');
        $scope.formParams.personalDobMonth = dob.format('MM');
        $scope.formParams.personalDobYear = dob.format('YYYY');            
    }
}

$scope.getSpouseICInfo = function(nric) {
    var dob = moment(nric.substring(0, 6), 'YYMMDD');
    if (dob.isValid() && dob.isAfter(moment())) {
        dob.subtract(100, 'years');
    }

    if (dob.isValid()){
        console.log(dob);
        $scope.formParams.spouseDobDate = dob.format('DD');
        $scope.formParams.spouseDobMonth = dob.format('MM');
        $scope.formParams.spouseDobYear = dob.format('YYYY');            
    }
}

$scope.initSignaturePad = function() {
    $scope.esignInit = true
    var wrapper = document.getElementById("signature-pad");
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
        var ratio =  Math.max(window.devicePixelRatio || 1, 1);

        // This part causes the canvas to be cleared
        // console.log(canvas.width)
        canvas.width = $(".signature-pad--body")[0].offsetWidth * ratio;
        // console.log(canvas.height)
        canvas.height = ($(".signature-pad--body")[0].offsetHeight - 5) * ratio;
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

    function DataURIToBlob(dataURI) {
        const splitDataURI = dataURI.split(',')
        const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
        const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

        const ia = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; i++)
            ia[i] = byteString.charCodeAt(i)

        return new Blob([ia], { type: mimeString })
      }

    clearButton.addEventListener("click", function (event) {
        signaturePad.clear();
    });

    confirmButton.addEventListener("click", function (event) {
        if (signaturePad.isEmpty()) {
            alert("Please provide a signature first.");
          } else {
            var dataURL = signaturePad.toDataURL();
            // $scope.formParams.esigndraw = dataURL;
            // console.log('eSign Base64: ', $scope.formParams.esigndraw);
            var myform = document.getElementById('multiStepForm');
            var form = new FormData(myform);
            form.append("esignFile", DataURIToBlob(dataURL));
            $scope.signdone();
          }
    })
}
});