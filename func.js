var $ = function(sel){
    return document.querySelector(sel);
};

var $All = function(sel){
    return document.querySelectorAll(sel);
};

var guid = 0;
var CL_COMPLETED = 'completed';
var CL_EDITING = 'editing';
var CL_SELECTED = 'selected';
var riskIdx = 0;

function update(){
    var items = $All('.todo-list .item');
    var filter = $('.filters li a.selected');
    var leftNum = 0;
    var item, i ,display;
    for (i = 0;i<items.length;++i){
        // count
        item = items[i];
        if (!item.classList.contains(CL_COMPLETED))leftNum++;
        //filters
        display = 'none';
        if (filter==null
            ||(filter.innerHTML=='Active'&&!item.classList.contains(CL_COMPLETED))
            ||(filter.innerHTML=='Completed'&&item.classList.contains(CL_COMPLETED))
        ){
            display = 'block';
        }
        item.style.display = display;
    }
    
    var completed = items.length - leftNum;
    var count = $('.todo-count');
    count.innerHTML = (leftNum||'No ') + (leftNum >1 ? ' itmes' : ' item')+' left';

    if(filter!=null && filter.innerHTML=='Completed')
        count.innerHTML = (completed||'No ') + (completed>1?' items':' item')+' done';

    $('.complete-all').style.display= items.length==0?'none':'inline-block';
    $('.clear-completed').style.display=items.length==0?'none':'inline-block';
}

function addTodo(message,datetime,riskIdx,completed){
    var todoList = $('.todo-list');
    var li_contain = document.createElement('li')
    var item = document.createElement('div');
    item.classList.add('item');
    var id = 'item'+ guid++;
    item.setAttribute('id',id);
    var risk = ['highRisk','midRisk','lowRisk'];
    item.classList.add(risk[riskIdx]);
    if(completed=='1')item.classList.add(CL_COMPLETED);
    item.innerHTML=[
        '<button class="destroy">X</button>',
        '<label class="todo-label">'+message+'</label>',
        '<label class="todo-time">'+datetime+'</label>',
        '<a class="todo-edit">Edit</a>',
        '<a class="todo-complete">√</a>',
    ].join('');
    
    var label = item.querySelector('.todo-label');
    var editButton = item.querySelector('.todo-edit');


    //editButton func
    editButton.addEventListener('click',function(){
        item.classList.add(CL_EDITING);

        var edit = document.createElement('input');
        var finished = false;
        edit.setAttribute('type','text');
        edit.setAttribute('class','edit');
        edit.setAttribute('value',label.innerHTML);
        // to avoid comflict
        label.innerHTML='';

        function finish(){
            if(finished)return;
            finish = true;
            item.removeChild(edit);
            item.classList.remove(CL_EDITING);
        }

        edit.addEventListener('blur',function(){
            finish();
            label.innerHTML=this.value;
        });

        edit.addEventListener('kepup',function(ev){
            if(ev.keyCode ==13){
                finish()
                label.innerHTML=this.value;
            }
        });

        item.appendChild(edit);
        edit.focus();
    },false);

    //completeButton func
    item.querySelector('.todo-complete').addEventListener('click',function(){
        updateTodo(id);
    });

    //destroy func
    item.querySelector('.destroy').addEventListener('click',function(){
        removeTodo(id);
    });

    li_contain.appendChild(item);
    insertByDate(li_contain)
    
    update();
}

function insertByDate(add_item){
    var list=$('.todo-list');
    var now_time = getTimeStamp(add_item.querySelector('.todo-time').innerHTML);
    var items = list.childNodes;

    if(items.length==0){
        list.insertBefore(add_item,list.firstChild);
            return;
    }

    for (var i =0;i<items.length;++i){
        var i_datetime = getTimeStamp(items[i].querySelector('.todo-time').innerHTML);
        if (now_time<=i_datetime){
            list.insertBefore(add_item,items[i]);
            return;
        }
    }
    list.appendChild(add_item);
}

function getTimeStamp(date){
    var arr = date.split('-');
    var tmp = new Date(arr[0],(arr[1]-1),arr[2]);
    return tmp.getTime();
}

function updateTodo(itemId,completed){
    var item = $('#'+itemId);
    completed = !item.classList.contains(CL_COMPLETED);
    if(completed)item.classList.add(CL_COMPLETED);
    else item.classList.remove(CL_COMPLETED);
    update();
}

function removeTodo(itemId){
    var todoList = $('.todo-list');
    var item_li = $('#'+itemId).parentNode;
    todoList.removeChild(item_li);
    update();
}

function clearCompletedTodoList(){
    var todoList = $('.todo-list');
    var items = todoList.querySelectorAll('.item');
    for (var i = items.length-1;i>=0;--i){
        var item = items[i];
        if(item.classList.contains(CL_COMPLETED)){
            todoList.removeChild(item.parentNode);
        }
    }
    update();
}

function completeAllTodo(){
    var items = $All('.todo-list .item');
    for (var i = 0;i<items.length;++i){
        var item = items[i];
        isCompleted = item.classList.contains(CL_COMPLETED);
        if (isCompleted)continue;
        item.classList.add(CL_COMPLETED);
    }
    update();
}

function onLeaveSave(){
    var storage = window.localStorage;
    storage.clear();
    var items = $All('.todo-list .item');
    storage.setItem('isEmpty',(items.length>0?0:1));
    var exist_items = new Array();
    for (var i = 0;i<items.length;++i){
        var item = items[i];
        var item_id = item.id;
        exist_items.push(item_id);
        var message = item.querySelector('.todo-label').innerHTML;
        var datetime = item.querySelector('.todo-time').innerHTML;
        var risk = 0;
        if(item.classList.contains('midRisk'))risk=1;
        if(item.classList.contains('lowRisk'))risk=2;
        var completed = item.classList.contains(CL_COMPLETED)?1:0;
        var item_data = {
            id:item_id,
            message:message,
            datetime:datetime,
            risk:risk,
            completed:completed
        };
        console.log(item_data)
        storage.setItem(item_id,JSON.stringify(item_data));
    }
    storage.setItem("item_list",exist_items)
}

function loadLocalStorage(){
    var storage = window.localStorage;
    var isEmpty = storage.getItem('isEmpty')=='1';
    if(isEmpty)return;
    var item_ids = storage.getItem('item_list').split(',');
    for (var i =item_ids.length-1; i>=0;--i){
        var item_val = JSON.parse(storage.getItem(item_ids[i]));
        addTodo(item_val['message'],item_val['datetime'],item_val['risk'],item_val['completed']);
    }
}

window.onload = function init(){
    var add_todo_text = $('.add-todo-text');
    var add_button = $('.add-todo-button');
    var datetime = $('.add-todo-date');
    add_button.addEventListener('click',function(){
        riskIdx = $('.add-todo-risk').selectedIndex;
        var message = add_todo_text.value;
        if (message ==''){
            console.warn('message is empty');
            return;
        }
        addTodo(message,datetime.value,riskIdx);
        add_todo_text.value='';
        datetime.value="2021-01-01";
    });

    var clearCompleted = $('.clear-completed');
    clearCompleted.addEventListener('click',function(){
        clearCompletedTodoList();
    });

    var completeAll = $('.complete-all');
    completeAll.addEventListener('click',function(){
        completeAllTodo();
    })

    var filters = $All('.filters li a');
    for (var i =0;i<filters.length;++i){
        (function(filter){
            filter.addEventListener('click',function(){
                if(filter.classList.contains(CL_SELECTED)){
                    filter.classList.remove(CL_SELECTED);
                    update();
                    return;
                }
                for (var j =0;j<filters.length;++j){
                    filters[j].classList.remove(CL_SELECTED);
                }
                filter.classList.add(CL_SELECTED);
                update();
            });
        })(filters[i])
    }
    loadLocalStorage();
    update();
}