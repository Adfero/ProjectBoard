angular.module('projectdash', []).
	config(function($routeProvider) {
		$routeProvider.
			when('/', {controller:MainCtrl, templateUrl:'templates/main.html'}).
			when('/login', {controller:LoginCtrl, templateUrl:'templates/login.html'}).
			when('/accounts', {controller:AccountCtrl, templateUrl:'templates/accounts.html'});
	}).
	factory('basecamp',function($http) {
		return {
			getIdentity: function(callback) {
				return $http.get('/identity')
					.then(function(result) {
						callback(result.data);
					});
			},
			getAccount: function(callback) {
				return $http.get('/account')
					.then(function(result) {
						if (result.data instanceof Object) {
							callback(result.data)
						} else {
							callback(false);
						}
					});
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
			getProjects: function(callback) {
				return $http.get('/projects').
					then(function(result) {
						if (result.data instanceof Array) {
							callback(result.data);
							return result.data;
						} else {
							callback([]);
							return [];
						}
					});
			},
			getTodoLists: function(project) {
				return $http.get('/todolists/'+project.id).
					then(function(result) {
						if (result.data instanceof Object) {
							project.todolists = {
								all: result.data,
								summary: {
									incomplete: 0
								}
							};
							result.data.forEach(function(todolist) {
								project.todolists.summary.incomplete += todolist.remaining_count;
							})
						}
					});
			},
			isLoggedIn: function(callback) {
				this.getIdentity(function(data) {
					if (data.link) 
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
			basecamp.getAccount(function(account) {
				if (account != false) {
					$scope.projects = basecamp.getProjects(function(projects) {
						projects.forEach(function(project) {
							basecamp.getTodoLists(project);
						});
					});
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
	basecamp.getIdentity(function(data) {
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