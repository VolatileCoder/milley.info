
  function changePage(pageId){
    document.location.hash = "#" + pageId;
  }
  function showPage(pageId){
    $(".page").hide();
    $(".preview").show();
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    setTimeout(function(){showPageReally(pageId)},100);
  }

  function showPageReally(pageId){
    
    document.body.scrollTop = document.documentElement.scrollTop = 0;
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
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }
  

  $(function(){
    
    $('.accordion-item').on('shown.bs.collapse', function () {
      this.scrollIntoView();  
    });

    $(window).on('hashchange', function (e) {
      showPage(location.hash);
    });
    
    if (window.location.hash) {
        $(window).trigger('hashchange');
    }else {
      window.location.hash = "intro";
    }

  });
  