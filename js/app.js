

function data($scope, $http) {
    // when the page loads for the first time
    if($scope.search == undefined) {
        $scope.search = "hi";
        $scope.currency = "USD";
        fetch();
    }
    
        var pendingTask;
        // will load results when the string in search box changes
        $scope.change = function() {
            if(pendingTask) {
                clearTimeout(pendingTask);
            }
            pendingTask = setTimeout(fetch, 800);
        };
        $scope.update = function() {
            $scope.search = $scope.others.Search[index].Title;
            $scope.change();
        };
        $scope.select = function() {
            this.setSelectionRange(0, this.value.length);
        }
        $scope.earnings = {};
        $scope.values = [];
        //function that grabs api data from the net
        function fetch() {
            //finding average price between 3 high volume exchanges.
            $http.get("https://coinmarketcap-nexuist.rhcloud.com/api/xmr")
            .success(function(response) {
                $scope.price = response.price.usd;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
            });
            $http.get("http://moneroblocks.info/api/get_stats/")
            .success(function(response) {
                //console.log(response.difficulty);
                $scope.difficulty = parseFloat(((response.difficulty)/1e9).toFixed(4));
                $scope.blockReward = (response.last_reward)/1e12;
                $http.get("http://moneroblocks.info/api/get_block_header/" + (response.height - 43200))
                .success(function(response) {
                    //console.log(response.block_header.difficulty);
                    $scope.diffChange = parseFloat(($scope.difficulty - (response.block_header.difficulty)/1e9).toFixed(4));
                    });        
                });        
                        
        }

        //this function grabs price data only when the currency is changed
        $scope.fetchPriceOnly = function() {
            //finding average price between 3 high volume exchanges.
            $http.get("https://coinmarketcap-nexuist.rhcloud.com/api/xmr")
            .success(function(response) {
                if ($scope.currency == "USD") {
                    $scope.price = response.price.usd;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "CNY") {
                    $scope.price = response.price.cny;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "RUB") {
                    $scope.price = response.price.rub;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "CAD") {
                    $scope.price = response.price.cad;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "EUR") {
                    $scope.price = response.price.eur;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "JPY") {
                    $scope.price = response.price.jpy;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "GBP") {
                    $scope.price = response.price.gbp;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "HKD") {
                    $scope.price = response.price.hkd;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                } else if ($scope.currency == "AUD") {
                    $scope.price = response.price.aud;
                $scope.price = parseFloat(parseFloat($scope.price).toFixed(2));
                    $scope.computeProfits();
                    return;
                }
            });
        }

    $scope.computeProfits = function() { 

            if ($scope.userHashSuffix == "h") {
                $scope.userHashSuffixMult = 1;
            } else if ($scope.userHashSuffix == "kh") {
                $scope.userHashSuffixMult = 1e3;
            } else if ($scope.userHashSuffix == "mh") {
                $scope.userHashSuffixMult = 1e6;
            }
            if ($scope.powerSuffix == "W") {
                $scope.userPowerSuffixMult = 0.001;
            } else {
                $scope.userPowerSuffixMult = 1;
            }
            //long block of math logic to find the hourly rates of gross earnings, power costs, pool fees, and profit
            $scope.earnings.hourGrossXMR = (($scope.userHash*(1-($scope.rejectRate/100)))/(($scope.difficulty*1e9)))*$scope.blockReward*3600*$scope.userHashSuffixMult;
            $scope.values[0] = [$scope.earnings.hourGrossXMR];
            $scope.earnings.hourGrossUSD = $scope.earnings.hourGrossXMR*$scope.price;
            $scope.values[1] = [$scope.earnings.hourGrossUSD];
            $scope.earnings.powerCostHour = ($scope.wattage*$scope.userPowerSuffixMult*$scope.powerCost)
            $scope.values[2] = [$scope.earnings.powerCostHour];
            $scope.earnings.poolCostHour = ($scope.earnings.hourGrossUSD*($scope.poolFee/100));
            $scope.values[3] = [$scope.earnings.poolCostHour];
            $scope.earnings.profitHour = (($scope.earnings.hourGrossUSD - $scope.earnings.powerCostHour) - $scope.earnings.poolCostHour);
            $scope.values[4] = [$scope.earnings.profitHour];
            //this loop is to create and store all of the profit values as hourly, daily, weekly and monthly
            for (var i = 0; i < $scope.values.length; i++) {
                //earnings/costs per day
                $scope.values[i][1] = $scope.values[i][0] * 24;
                //earnings/costs per week
                $scope.values[i][2] = $scope.values[i][1] * 7;
                //earnings/costs per month
                $scope.values[i][3] = $scope.values[i][1] * 30;
            }
            /*conditional that prevents the program from drawing the chart before all the required data has been collected*/
            if (typeof $scope.userHash !== "undefined" && typeof $scope.price !== "undefined" 
            && typeof $scope.difficulty !== "undefined") {
                $scope.drawChart();
            }
    }
    //function responsible for creating chart data and drawing chart
    $scope.drawChart = function(drawNew) {
        var labels = [];
        $scope.profit = [0];
        var rollingDiffFactor = 1;
        var projectedDifficulty = $scope.difficulty;
        for (var i = 0; i <= $scope.timeFrame; i++) {
            labels[i] = i + (i == 1? " Month" : " Months");
            if (i > 0) {
                //profit logic
                $scope.profit[i] = $scope.profit[i-1] + ($scope.values[1][3])*rollingDiffFactor - $scope.values[2][3] - $scope.values[3][3]*rollingDiffFactor;
                $scope.profit[i] =  parseFloat($scope.profit[i].toFixed(2));

                if ($scope.diffChange > 0) {
                    if ($scope.diffChange/$scope.difficulty > 0.1) {
                        projectedDifficulty += (($scope.diffChange/$scope.difficulty)*$scope.diffChange);
                    } else {
                        projectedDifficulty += ($scope.diffChange);
                    }
                } else if (-($scope.diffChange/$scope.difficulty) > 0.4) {
                    projectedDifficulty = $scope.difficulty;
                } else {
                    projectedDifficulty *= 1 + ($scope.diffChange)/$scope.difficulty;
                }
                if (projectedDifficulty < 1) {
                    projectedDifficulty = 1;
                }
                rollingDiffFactor = $scope.difficulty/(projectedDifficulty);
            }
        }
        var data = {
                labels: labels,
                datasets: [
            {
                label: "Profit",
                fillColor: "rgba(0,0,0,0.2)",
                strokeColor: "rgba(0,0,0,1)",
                pointColor: "rgba(0,0,0,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: $scope.profit
            }]
        };
        //logic to ensure the tooltips detect radius isn't too large when many points are present
        if ($scope.timeFrame <= 15) {
            var detectRadius = 8;
        } else if ($scope.timeFrame > 15 && $scope.timeFrame <= 23) {
            var detectRadius = 5;
        } else if ($scope.timeFrame > 23 && $scope.timeFrame <= 30) {
            var detectRadius = 3;
        } else {
            var detectRadius = 1;
        }
        var options = {
            pointHitDetectionRadius : detectRadius,
        };
        //Chart.defaults.global.responsive = true;
        //if the chart object doesn't exist yet, OR a complete redraw was called. Create new chart object
        if (typeof $scope.myLineChart == "undefined" || drawNew) {
            ctx = document.getElementById("myChart").getContext("2d");
            $scope.myLineChart = new Chart(ctx).Line(data, options);
        } else {
            for (var i = 0; i < $scope.profit.length;i++) {
                $scope.myLineChart.datasets[0].points[i].value = $scope.profit[i];
            }
            $scope.myLineChart.update();
        }
    }
        //Function that is called when user changes the number of months are to be included in the chart
        //destroys all old chart data then calls the drawChart function to create new data
        $scope.changeAxis = function() {
            $scope.myLineChart.destroy();
            $scope.drawChart(true);
        }
}