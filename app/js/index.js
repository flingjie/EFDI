
        var app = angular.module("myApp",['ngRoute']);
        app.controller("homeCtrl",function ($scope,$route,$location,$http,$timeout) {
            window.scrollTo(0, 0);
            $scope.$route = $route;
            homeInit();
            function homeInit(){
                checkWeb3($scope);
                $scope.minDate = getMinDate();
                $scope.mydate = "";
                $scope.summitBtn={
                    words:"Pay Insurance",
                    disable:false,
                }

                $scope.order  = {
                    date:'',
                    insurance_amount:null,
                    flight_no:'',
                    eth_address:'',
                }

            };
            $scope.addEth=function(add){
                $scope.order.insurance_amount+=add;
                $scope.order.insurance_amount = parseFloat($scope.order.insurance_amount.toFixed(2));
            };
            $scope.ethPost=function(){
                $http.post('/ajax/create-order',$scope.order).success(function(res){
                    console.log(res)
                    if(res.code==200){
                        //投保成功
                        $scope.summitBtn.words="Success！";
                        $scope.summitBtn.disable=false;
                        $timeout(function(){
                            homeInit()
                        },5000);
                    }
                    $scope.summitBtn.disable=false;
                }).error(function(res){
                    $scope.summitBtn.disable=false;
                });
            };
            $scope.summit=function(){
                if($scope.summitBtn.disable){
                    return;
                }
                $scope.summitBtn.disable=true;
                var myWeb3 = checkWeb3($scope);
                if(!myWeb3){
                    return;
                }
                console.log(myWeb3)
                console.log(web3)
                var efdiContract = web3.eth.contract(artfact);
                var contract_addr = "0xEFff3FeD41b9ae32cE96066C19186926cE718ae5";
                var efdi_contract = efdiContract.at(contract_addr);
                console.log(efdi_contract)
                myWeb3.eth.getAccounts(function(error, accounts) {
                    console.log("get account", error, accounts);
                    addr = accounts[0];
                    $scope.order.eth_address= addr;

                    //20190323
                    efdi_contract.createInsurance($scope.order.date.replace(/-/g,''), $scope.order.flight_no, $scope.order.insurance_amount, {from: addr,value: $scope.order.insurance_amount*Math.pow(10,18)}, function(err, result) {
                      if (!err)
                        console.log(result); 
                        $scope.ethPost();
                    })
                    
                }) 
            };
            $scope.dateChanged=function(){
            	console.log($scope.mydate)
            }

            $scope.checkHis=function(type){
                $location.url('/his?type='+type)
                //$location.path('/his');
            };
        });
        app.controller("hisCtrl",['$scope','$route','$location','$rootScope','$http',function ($scope,$route,$location,$rootScope,$http) {
            window.scrollTo(0, 0);
            $scope.$route = $route;
            $scope.isAll = $route.current.params.type=='all';
            if($scope.isAll){
                $scope.dateValue=new Date('2019/03/22');
            }
            
            $scope.back=function(){
	            $location.url('/home');
            };
            $scope.getHistory=function(){
                var api = $scope.isAll?'/ajax/get-history-order':'/ajax/get-user-history-order';
                if($scope.isAll){
                    console.log($scope.dateValue)
                    if(!$scope.dateValue){
                        return;
                    }
                    var date = formatDate($scope.dateValue);
                    $http.get(api+'?date='+date).success(function(res){
                        console.log(res)
                        if(res.code==200){
                            $scope.datas = res.data.list;
                        }
                     })
                }else{
                    var myWeb3 = checkWeb3($scope);
                    if(!myWeb3){
                        return;
                    }
                    myWeb3.eth.getAccounts(function(error, accounts) {
                        console.log("get account", error, accounts);
                        var eth_address = accounts[0];
                        $http.get(api+'?eth_address='+eth_address).success(function(res){
                            console.log(res)
                            if(res.code==200){
                                $scope.datas = res.data.list;
                            }
                        })
                    }) 
                }
            }
            $scope.getHistory();
        }]);
        app.config(["$routeProvider",function ($routeProvider) {
            var v=2;
            $routeProvider
                .when('/home',{
                    templateUrl:'templates/home.html?v='+v,
                    controller:'homeCtrl'
                })
                .when('/his',{
                    templateUrl:'templates/his.html?v='+v,
                    controller:'hisCtrl'
                })
                .otherwise({
                    redirectTo:'/home'
                });
        }]);
        app.controller("myCtrl",function ($scope,$rootScope) {
        	$scope.$on("$viewContentLoaded",function(){
            	console.log("ng-view content loaded!");
        	});

	        $scope.$on("$routeChangeStart",function(event,next,current){
	            //event.preventDefault(); //cancel url change
	            console.log(next)
                $scope.title="asfsdf";
                console.log($scope.title)
	            console.log("route change start!");
	        });
        });
        app.filter('large',function(){
        	return function(a){
        		return a>5;
        	}
        })

        function getMinDate(){
            var minDate = new Date().getTime()+2*24*60*60*1000;
            minDate = new Date(minDate);
            var m = minDate.getMonth()+1;
            m=m>9?m:'0'+m;
            var y = minDate.getFullYear();
            var d = minDate.getDate();
            d=d>9?d:'0'+d;
            return y+'-'+m+'-'+d;
        }
        function getToday(){
            var minDate = new Date().getTime();
            minDate = new Date(minDate);
            var m = minDate.getMonth()+1;
            m=m>9?m:'0'+m;
            var y = minDate.getFullYear();
            var d = minDate.getDate();
            d=d>9?d:'0'+d;
            console.log(y+'-'+m+'-'+d)
            return y+'-'+m+'-'+d;
        }

        function formatDate(date){
            date = date.getTime();
            date = new Date(date);
            var m = date.getMonth()+1;
            m=m>9?m:'0'+m;
            var y = date.getFullYear();
            var d = date.getDate();
            d=d>9?d:'0'+d;
            return y+'-'+m+'-'+d;
        };
        function checkWeb3($scope){
            if (window.web3 && web3.currentProvider.isMetaMask) {
                // 安装Metamask插件后web3已经定义在window对象下
                var myWeb3 = new Web3(window.web3.currentProvider);
                // 获取智能合约的ABI（Application Binary Interface）文件
                // contract.createInsurance(yyyymmdd, flightNo, price, {from: addr,value: web3.utils.toWei(that.amount.toString(), "ether")}, function(err, result) {
                //   if (!err)
                //     console.log(result); 
                // })

                return myWeb3;
            } else {
                $scope.alertInfo = true;
                return false;
            }
        }