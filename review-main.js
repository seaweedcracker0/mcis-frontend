angular.module('MCIS', []).
controller('formController', function($scope, $http) {
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
var inputMin = 12;

$scope.signaturePadObj = {}

$scope.triggerModal = function() {
    $scope.formParams.esignFile = null
    if($scope.signaturePadObj['signature-pad']) {
        $scope.clearSignaturePad('signature-pad')
    }
    $('#esign-modal').on('shown.bs.modal', function () {
        if(!$scope.esignInit) {
            $scope.esignInit = true
            $scope.init("signature-pad");
        }
    })
    $('#esign-modal').modal({show: true})
}

$scope.triggerApplicantModal = function() {
    $scope.formParams.applicantEsigndraw = null
    if($scope.signaturePadObj['applicant-signature-pad']) {
        $scope.clearSignaturePad('applicant-signature-pad')
    }
    $('#applicant-esign-modal').on('shown.bs.modal', function () {
        if(!$scope.applicantEsignInit) {
            $scope.applicantEsignInit = true
            $scope.init("applicant-signature-pad");
        }
    })
    $('#applicant-esign-modal').modal({show: true})
}

$scope.init = function(id) {
    $scope.initSignaturePad(id);
}

$scope.stagePolicyFn = function() {
    $scope.stagePolicy = true;
}

$scope.goBackPdpaFn = function() {
    $scope.stagePolicy = false;
}

$scope.stagePdpaFn = function() {
    $scope.stagePdpa = true;
}

$scope.goBackLandingFn = function() {
    $scope.stagePdpa = false;
}

$scope.nextSection = function(section) {
    // $scope.formValidation = true;
    // console.log($scope.formParams)

    // if ($scope.multiStepForm.$valid) {
        $scope.direction = 1;
        $scope.section = section;
        // $scope.formValidation = false;
    // }
}

$scope.backSection = function(section) {
    $scope.direction = 0;
    $scope.section = section;
}

// Navigation functions
$scope.nextStep = function (stage) {
//$scope.direction = 1;
//$scope.stage = stage;

// $scope.formValidation = true;

    // if ($scope.multiStepForm.$valid) {
        $scope.direction = 1;
        $scope.stage = stage;
        // $scope.formValidation = false;
    // }
};

$scope.backStep = function (stage) {
    $scope.direction = 0;
    $scope.stage = stage;
};

$scope.triggerSubmit = function() {
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

$scope.initSignaturePad = function(id) {
    var wrapper = document.getElementById(id);
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

    $scope.DataURIToBlob = function(dataURI) {
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
    //             alert("Please provide a signature first.");
    //         }
    //     }
        
    //     $scope.$apply();
    // })
}

$scope.clearSignaturePad = function(id) {
    $scope.signaturePadObj[id].clear()
}

$scope.confirmESign = function(id) {
    if ($scope.formParams.applicantEsigndraw || ! $scope.signaturePadObj[id].isEmpty()) {
        if(!$scope.formParams.applicantEsigndraw) {
            var dataURL =  $scope.signaturePadObj[id].toDataURL();
            $scope.formParams.applicantEsigndraw = $scope.DataURIToBlob(dataURL);
        }
        $scope.triggerSubmit()
    }  else {
        alert("Please provide a signature first.");
    }
}

$scope.rejectModal = function() {
    $('#reject-reason-modal').modal({show: true})
}

$scope.submitRejectReason = function() {
    console.log($scope.rejectReasonForm)
    $scope.formModalValidation = true
    if($scope.rejectReasonForm.$valid) {
        $scope.formModalValidation = false
        $scope.triggerSubmit()
    }
}

$scope.fileUploaded = function(ev) {
    $scope.formParams[ev.target.name] = ev.target.files[0]
    $scope.$apply()
}
});