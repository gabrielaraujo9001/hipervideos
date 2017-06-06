/** Funções de utilidades **/

//Função para retornar o tempo no formato 00:00
function toMMSS(t){
    var seg = Math.floor(t)%60;
    var min = Math.floor(t/60);

    if(seg<10) seg = "0"+seg;
    if(min<10) min = "0"+min;

    return min+":"+seg;//Exemplo: 01:59
}

//Função para criar um cookie
function setCookie(nome, valor, dias){
    var d = new Date();
    d.setTime(d.getTime() + (dias*24*60*60*1000));
    document.cookie = nome + "=" + valor + "; expires="+d.toUTCString();
}

//Função para capturar um cookie específico
function getCookie(nome) {
    var name = nome + "=";
    //Vetor de cookies separados por ";"
    var cookies = document.cookie.split(';');
    for(var i=0; i<cookies.length; i++) {
        var c = cookies[i];
        while(c.charAt(0)==' ') {
        	c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return null;
}