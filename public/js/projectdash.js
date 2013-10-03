var month=new Array();
month[0]="January";
month[1]="February";
month[2]="March";
month[3]="April";
month[4]="May";
month[5]="June";
month[6]="July";
month[7]="August";
month[8]="September";
month[9]="October";
month[10]="November";
month[11]="December";

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
							});
						}
					});
			},
			getEvents: function(project) {
				return $http.get('/events/'+project.id).
					then(function(result) {
						if (result.data instanceof Object) {
							if (result.data.length > 0) {
								var lastEvent = result.data[result.data.length-1];
								var date = new Date(Date.parse(lastEvent.ends_at));
								project.duedate = month[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
							}
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
							basecamp.getEvents(project);
						});
					});
				} else {
					$location.path('/accounts');
				}
			});
		} else {
			$location.path('/login');
		}
	});
	$scope.activeProject = function(project) {
		if (project.todolists) {
			return project.todolists.summary.incomplete > 0;
		} else {
			return true;
		}		
	}
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