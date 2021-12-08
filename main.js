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
    controller('formController', function($scope, $http) {
    $scope.formParams = {};
    $scope.stage = "";
    $scope.section = "";
    $scope.apiEndPoint = "";
    $scope.stagePolicy = false;

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

    $scope.submitForm = function () {
        var wsUrl = "http://localhost:8080/greeting";

        // Check form validity and submit data using $http
        if ($scope.multiStepForm.$valid) {
        $scope.formValidation = false;

        $http({
            method: 'POST',
            url: wsUrl,
            data: JSON.stringify($scope.formParams)
        }).then(function successCallback(response) {
            if (response
            && response.data
            && response.data.status
            && response.data.status === 'success') {
            $scope.stage = "success";
            } else {
            if (response
                && response.data
                && response.data.status
                && response.data.status === 'error') {
                $scope.stage = "error";
            }
            }
        }, function errorCallback(response) {
            $scope.stage = "error";
            console.log(response);
        });
        }
    };
      
    $scope.reset = function() {
    // Clean up scope before destorying
    $scope.formParams = {};
    $scope.stage = "";
    }

    $scope.initSignaturePad = function() {
        var wrapper = document.getElementById("signature-pad");
        var clearButton = wrapper.querySelector("[data-action=clear]");
        var canvas = wrapper.querySelector("canvas");
        var signaturePad = new SignaturePad(canvas, {
            // It's Necessary to use an opaque color when saving image as JPEG;
            // this option can be omitted if only saving as PNG or SVG
            backgroundColor: 'rgb(255, 255, 255)'
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
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
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

        clearButton.addEventListener("click", function (event) {
            signaturePad.clear();
        });
    }
});