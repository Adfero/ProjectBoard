angular.module('projectdash', []).
	config(function($routeProvider) {
		$routeProvider.
			when('/', {controller:MainCtrl, templateUrl:'templates/main.html'}).
			when('/login', {controller:LoginCtrl, templateUrl:'templates/login.html'}).
			when('/accounts', {controller:AccountCtrl, templateUrl:'templates/accounts.html'});
	}).
	factory('basecamp',function($http) {
		return {
			getIdentity: function() {
				return $http.get('/identity');
			},
			getAccount: function() {
				return $http.get('/account');
			},
			getAccounts: function() {
				return $http.get('/accounts').
					then(function(result) {
						if (result.data instanceof Array) {
							return result.data;
						} else {
							return [];
						}
					});
			},
			isLoggedIn: function(callback) {
				this.getIdentity().
					then(function(result) {
						if (result.data.link) 
							callback(false);
						else
							callback(true);
					});
			},
			selectAccount: function(accountId,callback) {
				$http.post('/account',{id:accountId}).
					then(function(result) {
						callback();
					});
			}
		};
	});

function MainCtrl($scope, $location, $timeout, basecamp) {
	basecamp.isLoggedIn(function(loggedin) {
		if (loggedin) {
			basecamp.getAccount().
				success(function(data, status, headers, config) {
					if (data instanceof Object) {

					} else {
						$location.path('/accounts');
					}
				});
		} else {
			$location.path('/login');
		}
	})
}

function LoginCtrl($scope, $location, $timeout, basecamp) {
	basecamp.getIdentity().
		success(function(data, status, headers, config) {
			if (data.link) {
				$scope.login = data.link;
			} else {
				$location.path('/');
			}
		});
}

function AccountCtrl($scope, $location, $timeout, basecamp) {
	$scope.accounts = basecamp.getAccounts();
	$scope.select = function(account) {
		basecamp.selectAccount(account.id,function() {
			$location.path('/');
		});
	};
}