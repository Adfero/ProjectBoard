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
			getTodoLists: function(project,callback) {
				var _this = this;
				return $http.get('/todolists/'+project.id).
					then(function(result) {
						if (result.data instanceof Object) {
							project.todolists = {
								all: result.data,
								incomplete: 0,
							};
							result.data.forEach(function(todolist) {
								project.todolists.incomplete += todolist.remaining_count;
								_this.getTodoList(project,todolist,function(project,todolist) {
									if (todolist.todos.remaining.length > 0) {
										todolist.todos.firstTodo = null;
										todolist.todos.lastTodo = null;
										var now = new Date();
										todolist.todos.remaining.forEach(function(todo) {
											if (todo.due_at) {
												todo.due_at_date = new Date(todo.due_at);

												if (todo.due_at_date.getTime() > now.getTime()) {
													if (todolist.todos.firstTodo == null) {
														todolist.todos.firstTodo = todo;
													}
													if (todolist.todos.lastTodo == null) {
														todolist.todos.lastTodo = todo;
													}

													if (todo.due_at_date.getTime() < todolist.todos.firstTodo.due_at_date.getTime()) {
														todolist.todos.firstTodo = todo;
													}
													if (todo.due_at_date.getTime() > todolist.todos.lastTodo.due_at_date.getTime()) {
														todolist.todos.lastTodo = todo;
													}
												}
											}
										});
										
										project.todolists.summary = {
											first: null,
											last: null
										}
										project.todolists.all.forEach(function(todolist) {
											if (todolist.todos != null 
												&& todolist.todos.firstTodo != null 
												&& (project.todolists.summary.first == null || todolist.todos.firstTodo.due_at_date.getTime() < project.todolists.summary.first.date.getTime())) {
												
												project.todolists.summary.first = {
													date: todolist.todos.firstTodo.due_at_date,
													str: formatDate(todolist.todos.firstTodo.due_at_date)
												}

											}
											if (todolist.todos != null 
												&& todolist.todos.lastTodo != null 
												&& (project.todolists.summary.last == null || todolist.todos.lastTodo.due_at_date.getTime() > project.todolists.summary.last.date.getTime())) {

												project.todolists.summary.last = {
													date: todolist.todos.lastTodo.due_at_date,
													str: formatDate(todolist.todos.lastTodo.due_at_date)
												}

											}
										});
										callback(project);
									}
								});
							});
							callback(project);
						}
					});
			},
			getTodoList: function(project,todolist,callback) {
				return $http.get('/todos/'+project.id+'/'+todolist.id).
					then(function(result) {
						if (result.data instanceof Object) {
							todolist.todos = result.data.todos;
							callback(project,todolist);
						}
					});
			},
			getEvents: function(project,callback) {
				return $http.get('/events/'+project.id).
					then(function(result) {
						if (result.data instanceof Object) {
							project.events = {
								all: result.data
							}
							if (result.data.length > 0) {
								var lastEvent = result.data[result.data.length-1];
								var lastDate = new Date(Date.parse(lastEvent.ends_at));
								var firstEvent = result.data[0];
								var firstDate = new Date(Date.parse(firstEvent.ends_at));
								project.events.summary = {
									first: {
										date: firstDate,
										str: formatDate(firstDate)
									},
									last: {
										date: lastDate,
										str:formatDate(lastDate)
									}
								}
							}
							callback(project);
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
	$scope.overdueTodos = {
		message: 'No overdo items',
		messageClass: 'active',
		todos: []
	}

	basecamp.isLoggedIn(function(loggedin) {
		if (loggedin) {
			basecamp.getAccount(function(account) {
				if (account != false) {
					var loadProjects = function() {
						$scope.projects = basecamp.getProjects(function(projects) {
							projects.forEach(function(project) {
								var computeDates = function(project) {
									if (project.events && project.events.summary && project.todolists && project.todolists.summary) {
										project.dates = {};
										if (project.events.summary.first.date.getTime() < project.todolists.summary.first.date.getTime()) {
											project.dates.first = project.events.summary.first;
										} else {
											project.dates.first = project.todolists.summary.first;
										}
										if (project.events.summary.last.date.getTime() > project.todolists.summary.last.date.getTime()) {
											project.dates.last = project.events.summary.last;
										} else {
											project.dates.last = project.todolists.summary.last;
										}
									} else if (project.events && project.events.summary) {
										project.dates = {
											first: project.events.summary.first,
											last: project.events.summary.last
										}
									} else if (project.todolists && project.todolists.summary) {
										project.dates = {
											first: project.todolists.summary.first,
											last: project.todolists.summary.last
										};
									}
								}
								basecamp.getTodoLists(project,function(project){
									computeDates(project);

									var now = new Date();
									$scope.overdueTodos.todos = [];
									projects.forEach(function(project) {
										if (project.todolists != null) {
											project.todolists.all.forEach(function(todolist) {
												if (todolist.todos) {
													todolist.todos.remaining.forEach(function(todo) {
														if (todo.due_at_date != null && todo.due_at_date.getTime() < now.getTime()) {
															$scope.overdueTodos.todos.push({
																project: project,
																todo: todo,
																date_str: formatDate(todo.due_at_date)
															});
														}
													});
												}
											});
										}
									});
									if ($scope.overdueTodos.todos.length > 0) {
										$scope.overdueTodos.messageClass = 'inactive';
										$scope.overdueTodos.message = '';
									}
								});
								basecamp.getEvents(project,function(project){
									computeDates(project);
								});
							});
						});
					}
					setInterval(loadProjects,60000)
					loadProjects();
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
			return project.todolists.incomplete > 0;
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

function formatDate(date) {
	return (date.getMonth()+1) + '/' + (date.getDate()+1) + '/' + (date.getFullYear()+'').substr(2);
}