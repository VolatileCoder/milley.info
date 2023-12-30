
  function changePage(pageId){
    document.location.hash = "#" + pageId;
  }
  function showPage(pageId){
    $(".page").hide();
    $(".preview").show();
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    setTimeout(function(){showPageReally(pageId)},1);
  }

  function showPageReally(pageId){
    $(pageId).show();
    console.log(pageId + "Preview");
    $(pageId + "Preview").hide();
    switch(pageId){
      case '#architecture':
        document.title = "Mark S. Milley - Architecture";
        break;
      case '#leadership':
        document.title = "Mark S. Milley - Leadership";
        break;
      case '#resume':
        document.title = "Mark S. Milley - Resume";
        break;
      case '#bio':
        document.title = "Mark S. Milley - Biography";
        break;
      default:
        document.title = "Mark S. Milley - Welcome";
    }
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
  