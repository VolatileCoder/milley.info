
  function changePage(pageId){
    document.location.hash = "#" + pageId;
    location.reload();
  }
  function showPage(pageId){
    $(".page").hide();
    $(".preview").show();
    $(pageId).show();
    console.log(pageId + "Preview");
    $(pageId + "Preview").hide();
    switch(pageId){
      case '#architecture':
        document.title = "Architecture | Mark S. Milley";
        break;
      case '#leadership':
        document.title = "Leadership | Mark S. Milley";
        break;
      case '#resume':
        document.title = "Resume | Mark S. Milley";
        break;
      case '#bio':
        document.title = "Biography | Mark S. Milley";
        break;
      default:
        document.title = "Welcome | Mark S. Milley";
    }
  }
  

  $(function(){

    $(window).on('hashchange', function (e) {
      showPage(location.hash);
    });
    
    if (window.location.hash) {
      showPage(location.hash);
    }else {
      showPage("#intro");
    }

  });
  