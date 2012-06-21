function(user) {
  for(r in user.roles){
    emit(user.roles[r], user);
  }
}

function(user) {
  emit(user.last_name, user);
}