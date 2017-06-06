/*
    ** Projeto: Oficinas de criação de hipervídeos interativos **
    **  Orientadores: Melo Jr, Windson Viana e Ismael Furtado  **
    **        Desenvolvedor web: Gabriel Rodrigues             **
    **              Designer: Pedro Ítalo                      **
*/

//Parte que lida com a chamada do arquivo JSON que contém as perguntas
var chamadaJSON = (function(){
    var chamadaJSON = null;
    $.ajax({
        'url': "informacoes.json",
        'dataType': "json",
        'async': false,
        'global': false,
        'success': function(data){
            chamadaJSON = data;
        }
    });
    return chamadaJSON;
})();

/* Variáveis globais da aplicação */
var clips = chamadaJSON.clips;
var tituloJSON = chamadaJSON["titulo"];
var tipo = chamadaJSON["tipo"];
var temposInteracoes = [];
var rdy = true;
var popcorn, audio, larguraVideo, alturaVideo, aspectRatio, volume, telaCheia = false, tempo, prox, duracao, posicaoAnterior, pontos = 0,
    quantidadeAcertos = 0, quantidadePerguntas = 0;
/* ------------------------------ */

/* Quando o documento terminar de ser carregado, esta função será acionada */
$(document).ready(function(){

    $("#titulo-video, title").html(tituloJSON);

    /* Relativo à biblioteca Popcorn.js, usada para manipular o vídeo e o áudio */
    popcorn = Popcorn("#video");
    popcorn.autoplay(false);
    popcorn.preload("auto");
    popcorn.on("canplayall", lerTempos);
    popcorn.on("timeupdate", timeUpdate);
    popcorn.on("play", executarVideo);
    popcorn.on("pause", executarVideo);
    popcorn.on("ended", conclusaoDoVideo);

    audio = Popcorn("#audio");
    audio.autoplay(false);
    audio.preload("none");
    /* ------------------------------------------------------------ */

    /* Botão de play e pause do vídeo */
    $("#btn-play-pause, #video-player").click(function(){
        if(popcorn.paused()){
            popcorn.play();
            $("#play").css("display", "none");
            apagar();
        }else{
            popcorn.pause();
            $("#play").css("display", "block");
        }
    });
    /* ------------------------------------------------------------ */

    /* Botão e controlador de volume */
    $("#volume, #volume-controller").mouseover(function(){
        $("#volume-controller").css("display", "block");
    });
    $("#volume, #volume-controller").mouseout(function(){
        $("#volume-controller").css("display", "none");
    });
    $("#btn-volume").click(function(){
        if(popcorn.volume() != 0){
            $("#btn-volume").attr("src", "assets/images/mudo32.png");
            $("#volume-handle").css("height", 0);
            popcorn.volume(0);
        }else{
            $("#btn-volume").attr("src", "assets/images/volume32.png");
            $("#volume-handle").css("height", volume*100+"%");
            popcorn.volume(volume);
        }
    });
    $("#volume-handle-background").click(function(evento){
        var v = parseInt(($(this).height() - (evento.pageY - $(this).offset().top))/$(this).height()*100);
        volume = (v+(10-v%10))/100;
        $("#volume-handle").css("height", volume*100+"%");
        popcorn.volume(volume);
        
        if($("#btn-volume").attr("src") == "assets/images/mudo32.png")
            $("#btn-volume").attr("src", "assets/images/volume32.png");
    });
    /* ------------------------------------------------------------ */

    /* Botão de tela cheia */
    $("#btn-tela-cheia").click(function(){
        if(telaCheia)
            $("#btn-tela-cheia").attr("src", "assets/images/telacheia32.png");
        else
            $("#btn-tela-cheia").attr("src", "assets/images/telanormal32.png");
        telaCheia = !telaCheia; // Operação lógica para alternar entre verdadeiro e falso
    });
    /* ------------------------------------------------------------ */

    /* Modificando a escala inicial da barra de progresso para mostrar um pouco
    ** dela mesmo antes de iniciar o vídeo
    */
    $("#progresso-hover").css("transform","scaleX("+0.001+")");
    $("#progresso").css("transform","scaleX("+0.001+")");

    /* Fazendo com que um mouseover na barra de progresso mostre
    ** a posição atual do mouse no vídeo
    */
    $("#barra-progresso-container").mouseover(function(){
        var origem = $(this).offset().left;
        $(this).css("cursor","pointer");
        $("#progresso-hover").css("display", "block");
        $("#previews").css("display", "block");

        $(this).mousemove(function(evento){
            var x = (evento.pageX - origem)/$("#progresso-hover").width();
            $("#progresso-hover").css("transform","scaleX("+x+")");
            if(evento.pageX != posicaoAnterior){
                posicaoAnterior = evento.pageX;
                mudaPreview(evento.pageX, origem);
            }
        });

        $(this).click(function(evento){
            if(tipo != "avaliacao"){
                var x = (evento.pageX - origem)/$("#progresso-hover").width();
                popcorn.currentTime(x * duracao);
            }
        });
    });

    $("#barra-progresso-container").mouseout(function(){
        $("#progresso-hover").css("display", "none");
        $("#previews").css("display", "none");
    });

    /* Indicador de pontuação durante o vídeo */
    if(tipo == "avaliacao")
        $("div").remove("#pontos");
});

/* Função que altera o tamanho da barra de carregamento */
function carregamento(evento){
    var buff = popcorn.buffered();
    $("#carregamento").css("transform","scaleX("+buff.end(0)/duracao+")");
    
    if(buff.end(0) <= popcorn.currentTime())
        $("#buffering").css("display", "block");
    else
        $("#buffering").css("display", "none");
}

/* Função para lidar com a mudança de preview */
function mudaPreview(posX, origem){
    var t, larg, indiceReal, indiceRelativo, scrollX, scrollY, numImagem, bg;

    t = Math.floor((posX - origem)/$("#progresso-hover").width()*duracao);
    larg = $("#previews").width();
    indiceReal = ((t - (t%4))/4);
    indiceRelativo = indiceReal%25;
    scrollX = (indiceRelativo%5)*larg;
    scrollY = Math.floor(indiceRelativo/5)*90;
    numImagem = Math.floor(indiceReal/25)+1;
    bg = "url('assets/images/previews/preview0"+numImagem+".jpg') repeat scroll -"+scrollX+"px -"+scrollY+"px";

    $("#previews").css({"transform":"translateX("+(posX-larg)+"px)", "background":bg});
    $("#previews > span").html(toMMSS(t));
}

/* Função que lida com os eventos de play e pause do vídeo */
function executarVideo(evento){
    if(evento.type == "play"){
        $("#btn-play-pause").attr("src", "assets/images/pause32.png");
        $("#play").css("display", "none");
    }else{
        $("#btn-play-pause").attr("src", "assets/images/play32.png");
    }
}

/* Função que apaga os elementos de perguntas, respostas e outras interações da tela */
function apagar(){
    $("div").remove(".pergunta");
    $("div").remove(".respostas");
    $("img").remove(".point-n-click");
    $("div").remove(".informacao-adicional");
    $("div").remove(".botao-continuar");
    $("#video-drawboard").css("display", "none");
    setTimeout(function(){rdy=true;}, 1000);
    popcorn.play();
}

//Função que mostra a próxima pergunta a ser mostrada
function proximaInteracao(interacao, i){
    popcorn.pause();
    if(interacao["tipo"] != "resposta"){
    interacaoAtual = i;

    //Torna o marcador da interação atual azul
    var marc = $("#marcadores > ul").children(":nth-child("+(i+1)+")");
    marc.css("background-color","#5077B6");

    //Pergunta
    //var novaPergunta = $('<div/>',{'class':'pergunta'}).html('<div class=indice-pergunta>'+(i+1)+'.</div><p>'+interacao["texto"]+'</p>');
    //$("#video-container").append(novaPergunta);

    //Narração
    /*if(interacao["narracao"]){
        $("#audio").attr("src", interacao["narracao"]);
        setTimeout(function(){
            audio.play();
        }, 700);
    }*/
 
    /* Função que lida com a resolução de perguntas */
    function respondeu(evento){
        var pai = evento.target;
        var cor, certa;

        /*if(interacao["certa"]-1 == parseInt($(pai).attr("num"))){
            cor = "#9AE530";
            certa = true;
            pontos += interacao["valor"];
            quantidadeAcertos++;
        }else{
            cor = "#EB1C24";
            certa = false;
        }*/

        if(tipo != "avaliacao"){
            /*if(interacao["tipo"] == "point_n_click")
                $(pai).next().css("background-color", cor);
            else
                $(pai).css("background-color", cor);*/

            /* Se houver alguma informação adicional relacionada à pergunta respondida */
            /*if(interacao["informacaoAdicional"]){
                setTimeout(function(){
                    if(certa){
                        if(interacao["ativarQuando"] == "ambos" || interacao["ativarQuando"] == "certa"){
                            var info = $('<div/>',{'class':'informacao-adicional'}).html(interacao["informacaoAdicional"]);
                            $("#video-container").append(info);
                        }
                    }else{
                        if(interacao["ativarQuando"] == "ambos" || interacao["ativarQuando"] == "errada"){
                            var info = $('<div/>',{'class':'informacao-adicional'}).html(interacao["informacaoAdicional"]);
                            $("#video-container").append(info);
                        }
                    }
                }, 2000);
            }*/
            //marc.css("background-color", cor);
                    
            /* Mostrar botão de continuar */
            setTimeout(function(){
                /*var cont = $('<div/>',{'class':'botao-continuar'}).html("Continuar");
                cont.click(apagar);
                $("#pontos").html("Pontos: "+pontos);
                $("#video-container").append(cont);*/
                jump(interacao["hotspots"][parseInt($(pai).attr("num"))]["link"]);
            }, 500);
        }else{
            setTimeout(apagar, 500);
        }
        audio.pause();
    }

            /* Aqui haverá uma escolha para decidir que tipo de elemento mostrar
            ** de acordo com o tipo de interação especificado
            */
            switch(interacao["tipo"]){
                case "pergunta":
                    for(var j=0; j<interacao["hotspots"].length; j++){
                        var resp = $('<div/>',{'class':'respostas', 'num':j}).html(interacao["hotspots"][j]);
                        resp.css("left", interacao["hotspots"][j]["x"]+"px");
                        resp.css("top", interacao["hotspots"][j]["y"]+"px");
                        resp.css("width", interacao["hotspots"][j]["largura"]+"px");
                        resp.css("height", interacao["hotspots"][j]["altura"]+"px");
                        resp.click(respondeu);
                        $("#video-container").append(resp);
                    }
                    break;
                case "point_n_click":
                    for(var j=0; j<interacao["respostas"].length; j++){
                        var resp = $('<img/>',{'src':interacao["respostas"][j]["imagem"], 'class':'point-n-click', 'num':j});
                        resp.css({
                            "top":interacao["respostas"][j]["y"]+"%",
                            "left":interacao["respostas"][j]["x"]+"%",
                            "height":interacao["respostas"][j]["altura"]+"%",
                        });
                        resp.mouseover(function(){
                            $(this).next().css({"background-color":"#EAEAEA", "color":"#2D2D2D"});
                        });
                        resp.mouseout(function(){
                            $(this).next().css({"background-color":"#2D2D2D", "color":"#EAEAEA"});
                        });
                        resp.click(respondeu);

                        var indice = $('<div/>',{'class':'indice-point-n-click'}).html(j+1);
                        indice.css({
                            "top": interacao["respostas"][j]["indiceY"]+"%",
                            "left": interacao["respostas"][j]["indiceX"]+"%"
                        });
                        $("#video-drawboard").css("display","inline-block").append(resp, indice);
                    }
                    break;
                case "bifurcacao":
                    for(var j=0; j<interacao["respostas"].length; j++){
                        var resp = $('<div/>',{'class':'respostas', 'num':j}).html(interacao["respostas"][j]);
                        resp.css("top", (28 + 4 * j)+"vh");
                        resp.click(function(evento){
                            popcorn.currentTime(interacao["momentos"][$(evento.target).attr("num")]);
                            apagar();
                        });
                        $("#video-container").append(resp);
                    }
                    break;
                default:
                    console.log("Essa interação ainda não foi feita, ou não possui opções de resposta.");
                    $("#play").css("display", "block");
    }
    }else{
        setTimeout(function(){
            jump(parseInt(interacao["link"]));
        }, 100);
    }
}

/* Função que captura os tempos de cada uma das interações descritas no arquivo JSON
** e adiciona os marcadores dessas interações à barra de progresso do vídeo
*/
function lerTempos(){
    /* Inicializando as variáveis globais do vídeo */
    duracao = popcorn.duration();
    larguraVideo = popcorn.video.videoWidth;
    alturaVideo = popcorn.video.videoHeight;
    aspectRatio = larguraVideo/alturaVideo;
    volume = popcorn.volume();

    /* Estado inicial do indicador de tempo */
    $("#tempo").html(toMMSS(0)+" / "+toMMSS(duracao));

    /* Estado inicial do controlador de volume */
    $("#volume-handle").css("height", volume*100+"%");

    /* Modificando as dimensões do drawboard sempre que o navegador for redimensionado.
    ** Drawboard é onde as imagens do point-n-click são desenhadas.
    */
    $("#video-drawboard").css({"width":$("#video").width()/$(document).width()*100+"%"});
    $(window).resize(function(){
        $("#video-drawboard").css({"width":$("#video").width(), "height":$("#video").height()});
    });
    
    /* Modificando as dimensões da DIV de preview para seguir a proporção do vídeo
    ** Estou usando o número 90 porque quero que as previews tenham altura fixa de 90px. O que vai
    ** variar de vídeo para vídeo é a largura.
    */
    $("#previews").css({"width":(aspectRatio*90)+"px", "height":90+"px"});

    /* Marcadores das perguntas e quantidades de perguntas */
    var l = $("#progresso").width();
    for(var i = 0 ; i < clips.length; i++){
        if(clips[i]["tipo"] == "pergunta"){
            temposInteracoes[i] = clips[i]["tempo_final"];

            var classe;
            if(clips[i]["tipo"] == "explicacao")
                classe = 'marcador-explicacao';
            else
                classe = 'marcador-multipla-escolha';

            var marcador = $('<li/>',{'class':classe}).css({"left": 100*(temposInteracoes[i]/duracao - 0.0078125)+"%"});
            $("#marcadores > ul").append(marcador);

            /* Quantidade de perguntas no vídeo */
            quantidadePerguntas++;
        }
    }

    popcorn.on("progress", carregamento);

    /* Loop que infileira todas as interações do vídeo */
    clips.forEach(function(obj, index){
        popcorn.cue(obj["tempo_final"], function(){
            proximaInteracao(obj, index);
        });
    });
}

//Função para lidar com cada mudança no tempo do vídeo
function timeUpdate(evento){
    tempo = Math.floor(popcorn.currentTime());
    $("#tempo").html(toMMSS(tempo)+" / "+toMMSS(duracao));
    $("#progresso").css("transform","scaleX("+popcorn.currentTime()/duracao+")");
}

function conclusaoDoVideo(evento){
    $("span.titulo-final").html(tituloJSON);
    $("span.numero-de-perguntas").html(quantidadeAcertos+" de "+quantidadePerguntas);

    var porc = parseInt(quantidadeAcertos/quantidadePerguntas*100);
    var cor;
    $("span.porcentagem-de-respostas").html("("+porc+"%)");

    if(porc <= 25)
        cor = "#EB1C24";
    else if(porc <= 50)
        cor = "#F7C026";
    else if(porc <= 75)
        cor = "#5077B6";
    else if(porc <= 100)
        cor = "#9AE530";

    $("span.numero-de-perguntas").css("color", cor);
    $("span.porcentagem-de-respostas").css("color", cor);

    if(pontos == 1)
        $("span.pontuacao").html(pontos+" ponto");
    else
        $("span.pontuacao").html(pontos+" pontos");
    
    $(".tela-de-conclusao").css("display", "block");
}

//Função para lidar com saltos de hiperlinks
function jump(numeroClip){
    console.log(clips[numeroClip-1]["nome"]);
    popcorn.currentTime(clips[numeroClip-1]["tempo_inicial"]);
    apagar();
}