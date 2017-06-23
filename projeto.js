/*
    ** Projeto: Oficinas de criação de hipervídeos interativos **
    **  Orientadores: Melo Jr, Windson Viana e Ismael Furtado  **
    **        Desenvolvedor web: Gabriel Rodrigues             **
    **              Designer: Pedro Ítalo                      **
*/

/* Variáveis globais da aplicação */
var clips = chamadaJSON.clips; //chamadaJSON está definido em index.php
var tituloJSON = chamadaJSON["titulo"];
var tipo = chamadaJSON["tipo"];
var temposInteracoes = [];
var rdy = true;
var usuarioAtivo = true;
var interacaoAtiva = false;
var inatividadeTimeout;
var clipAtual = 0;
var popcorn, audio, larguraVideo, alturaVideo, aspectRatio, volume, telaCheia = false, tempo, prox, duracao, posicaoAnterior, pontos = 0,
    quantidadeAcertos = 0, quantidadePerguntas = 0;
/* ------------------------------ */

/* Quando o documento terminar de ser carregado, esta função será acionada */
$(document).ready(function(){

    /* Relativo à biblioteca Popcorn.js, usada para manipular o vídeo e o áudio */
    popcorn = Popcorn("#video");
    popcorn.autoplay(false);
    popcorn.load();
    popcorn.on("loadeddata", lerTempos);
    popcorn.on("timeupdate", timeUpdate);
    popcorn.on("play", executarVideo);
    popcorn.on("pause", executarVideo);
    popcorn.on("ended", conclusaoDoVideo);

    audio = Popcorn("#audio");
    audio.autoplay(false);
    audio.preload("none");
    /* ------------------------------------------------------------ */

    /* Botão de play e pause do vídeo */
    $("#play-pause, #video-player").click(function(){
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

    /* Atividade do usuário em relação ao player */
    $("#area-player").mousemove(function(){
        resetDelay();
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
            setCookie("volume", 0, 1);
        }else{
            $("#btn-volume").attr("src", "assets/images/volume32.png");
            if(volume == 0)
                volume = 1;
            $("#volume-handle").css("height", volume*100+"%");
            popcorn.volume(volume);
            setCookie("volume", volume, 1);
        }
    });
    $("#volume-handle-background").click(function(evento){
        var v = parseInt(($(this).height() - (evento.pageY - $(this).offset().top))/$(this).height()*100);
        volume = (v+(10-v%10))/100;
        $("#volume-handle").css("height", volume*100+"%");
        popcorn.volume(volume);
        setCookie("volume", volume, 1);
        
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
    bg = "url('"+previewsURL+"preview0"+numImagem+".jpg') repeat scroll -"+scrollX+"px -"+scrollY+"px";

    $("#previews").css({"transform":"translateX("+(posX-larg)+"px)", "background":bg});
    $("#previews > span").html(toMMSS(t));
}

/* Função que lida com os eventos de play e pause do vídeo */
function executarVideo(evento){
    if(evento.type == "play"){
        $("#play-pause > img").attr("src", "images/icons/pause32.png");
        $("#play").css("display", "none");
        $("#buffering").css("display", "none");
    }else{
        $("#play-pause > img").attr("src", "images/icons/play32.png");
    }
}

/* Função que apaga os elementos de perguntas, respostas e outras interações da tela */
function apagar(){
    $("div").remove(".pergunta");
    $("div").remove(".respostas");
    $("img").remove(".point-n-click");
    $("img").remove(".point-n-click2");
    $("div").remove(".informacao-adicional");
    $("div").remove(".botao-continuar");
    $("#video-drawboard").css("display", "none");
    setTimeout(function(){rdy=true;}, 1000);
    console.log("Apagou");
    popcorn.play();
}

//Função que mostra a próxima pergunta a ser mostrada
function proximaInteracao(interacao, i){
    if(interacao["tipo"] != "normal" && interacao["tipo"] != "explicacao"){
        popcorn.pause();
    interacaoAtual = i;
    interacaoAtiva = true;

    //Torna o marcador da interação atual azul
    //var marc = $("#marcadores > ul").children(":nth-child("+(i)+")");
    var marc = $("#marcadores > ul > li[id='"+ interacao["id"] +"']");
    marc.css("background-color","#5077B6");
        console.log(marc.attr("id")+3);

    //Muda o texto da barra de controles para o título do clip atual
    $("#clip-atual").html(interacao["nome"]);

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
        
        function point_click(evento){
            $("div").remove(".informacao-adicional");
            $("img").remove(".point-n-click");
            
            var atual = parseInt($(evento.target).attr("num"));
            var tam_inf = interacao["informacao_adicional"][0]["texto"].length;
            
            var infAdic = $('<div/>',{'class':'informacao-adicional'}).html(interacao["informacao_adicional"][0]["texto"][atual]);
            
            if(interacao["informacao_adicional"][0]["bottom"] != undefined)
                infAdic.css("bottom", interacao["informacao_adicional"][0]["bottom"]+"%");
            
            var proxInf = $('<img/>',{'src':'hipervideos/'+interacao["informacao_adicional"][1]["imagem"], 'class':'point-n-click2', 'num':atual+1});
            
            infAdic.append(proxInf);
            
            if(atual+1 < tam_inf)
                proxInf.click(point_click);
            else
                proxInf.click(function(){
                    jump(parseInt(interacao["informacao_adicional"][1]["hiperlink"]));
                });
            
            $("#video-container").append(infAdic);
        }
 
    /* Função que lida com a resolução de perguntas */
    function respondeu(evento){
        var pai = evento.target;
        var cor, certa;

        if(interacao["correta"] != undefined){
            if(interacao["correta"] == parseInt($(pai).attr("num"))){
                cor = "#9AE530";
                certa = true;
                pontos += interacao["pontuacao"];
                quantidadeAcertos++;
            }else{
                cor = "#EB1C24";
                certa = false;
            }
        }

        if(tipo != "avaliacao"){
            if(interacao["correta"] != undefined){
                if(interacao["tipo"] == "point_n_click")
                    $(pai).next().css("background-color", cor);
                else if(interacao["tipo"] == "multipla_escolha"){
                    $(pai).css("background-color", cor);
                    $(pai).css("color", "#000000");
                }
                else{
    
                }

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
                marc.css("background-color", cor);
            }
            
            if(interacao["informacao_adicional"]!=undefined){
                setTimeout(function(){
                var infAdic = $('<div/>',{'class':'informacao-adicional'}).html(interacao["informacao_adicional"][0]["texto"]);
                
                var proxInf = $('<img/>',{'src':'hipervideos/'+interacao["informacao_adicional"][1]["imagem"], 'class':'point-n-click2'});
                
                infAdic.append(proxInf);
                
                proxInf.click(function(){
                    jump(parseInt(interacao["informacao_adicional"][1]["hiperlink"]));
                });
                
                $("#video-container").append(infAdic);
                },1000);
            }else{
            /* Mostrar botão de continuar */
            setTimeout(function(){
                /*var cont = $('<div/>',{'class':'botao-continuar'}).html("Continuar");
                cont.click(apagar);*/
                $("#pontos").html("Pontos: "+pontos);
                //$("#video-container").append(cont);
                //jump(interacao["hotspots"][parseInt($(pai).attr("num"))]["link"]);
                jump(parseInt(interacao["hotspots"][parseInt($(pai).attr("num"))]["hiperlink"]));
            }, 1000);
            }
        }else{
            setTimeout(function(){
                apagar();
            }, 500);
        }
        audio.pause();
        interacaoAtiva = false;
    }

            /* Aqui haverá uma escolha para decidir que tipo de elemento mostrar
            ** de acordo com o tipo de interação especificado
            */
            switch(interacao["tipo"]){
                case "multipla_escolha":
                    var perg = $('<div/>',{'class':'pergunta'}).html(interacao["hotspots"][0]);
                    perg.css("left", interacao["hotspots"][0]["x"]+"px");
                    perg.css("top", interacao["hotspots"][0]["y"]+"px");
                    perg.css("width", interacao["hotspots"][0]["largura"]+"px");
                    perg.css("height", interacao["hotspots"][0]["altura"]+"px");
                    perg.html(interacao["hotspots"][0]["texto"]);
                    $("#video-container").append(perg);
                    
                    for(var j=1; j<interacao["hotspots"].length; j++){
                        var resp = $('<div/>',{'class':'respostas', 'num':j}).html(interacao["hotspots"][j]);
                        resp.css("left", interacao["hotspots"][j]["x"]+"px");
                        resp.css("top", interacao["hotspots"][j]["y"]+"px");
                        resp.css("width", interacao["hotspots"][j]["largura"]+"px");
                        resp.css("height", interacao["hotspots"][j]["altura"]+"px");
                        resp.html(interacao["hotspots"][j]["texto"]);
                        resp.click(respondeu);
                        $("#video-container").append(resp);
                    }
                    break;
                case "point_n_click":
                    for(var j=0; j<interacao["hotspots"].length; j++){
                        if(interacao["hotspots"][j]["imagem"] != undefined){
                            var resp = $('<img/>',{'src':'hipervideos/'+interacao["hotspots"][j]["imagem"], 'class':'point-n-click', 'num':j});
                        }else{
                            var resp = $('<div/>',{'class':'respostas', 'num':j});
                        }
                        resp.css({
                            "top":interacao["hotspots"][j]["y"]+"px",
                            "left":interacao["hotspots"][j]["x"]+"px",
                            "height":interacao["hotspots"][j]["altura"]+"px",
                            "width":interacao["hotspots"][j]["largura"]+"px"
                        });
                        resp.mouseover(function(){
                            $(this).next().css({"background-color":"#EAEAEA", "color":"#2D2D2D"});
                        });
                        resp.mouseout(function(){
                            $(this).next().css({"background-color":"#2D2D2D", "color":"#EAEAEA"});
                        });
                        resp.click(point_click);

                        $("#video-container").append(resp);
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
                case "informacao_adicional":
                    var info = $('<div/>',{'class':'informacao-adicional'}).html(interacao["texto"]);
                    var continuar = $('<div/>',{'class':'botao-continuar'}).html("Continuar");
                    continuar.click(apagar);
                    $("#video-container").append(info, continuar);
                    break;
                default:
                    console.log("Essa interação ainda não foi feita, ou não possui opções de resposta.");
                    $("#play").css("display", "block");
    }
    }else{
        jump(parseInt(interacao["hiperlink"]));
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
        if(clips[i]["tipo"] == "multipla_escolha"){
            temposInteracoes[i] = clips[i]["tempo_final"];

            var classe = 'marcador-multipla-escolha';

            var marcador = $('<li/>',{'class':classe,'id':clips[i]["id"]}).css({"left": 100*(temposInteracoes[i]/duracao - 0.0078125)+"%"});
            $("#marcadores > ul").append(marcador);

            /* Quantidade de perguntas no vídeo */
            quantidadePerguntas++;
        }else if(clips[i]["tipo"] == "informacao_adicional"){
            temposInteracoes[i] = clips[i]["tempo_final"];
            var marcador = $('<li/>',{'class':'marcador-informacao-adicional','id':clips[i]["id"]}).css({"left": 100*(temposInteracoes[i]/duracao - 0.0078125)+"%"});
            $("#marcadores > ul").append(marcador);
        }else if(clips[i]["tipo"] == "point_n_click"){
            temposInteracoes[i] = clips[i]["tempo_final"];

            var classe = 'marcador-point-n-click';

            var marcador = $('<li/>',{'class':classe,'id':clips[i]["id"]}).css({"left": 100*(temposInteracoes[i]/duracao - 0.0078125)+"%"});
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
    apagar();
    popcorn.currentTime(clips[numeroClip-1]["tempo_inicial"]);
}

//Funções para esconder e mostrar os controles do vídeo
function mostraControles(){
    $("#container-controles, #barra-progresso-container, #fundo-controles").removeClass('fade-out');
}

function escondeControles(){
    $("#container-controles, #barra-progresso-container, #fundo-controles").addClass('fade-out');
}

/* Estas funções lidam com o controle da visibilidade dos elementos do player
   de acordo com a atividade do usuário: se ele estiver movendo o mouse (ou tocando
   na tela, no caso de dispositivos touch), os controles do player devem ficar visíveis.
   Caso contrário, devem ser escondidos.
*/
function resetDelay(event){
    mudaEstadoUsuario(true);

    clearTimeout(inatividadeTimeout);
    inatividadeTimeout = setTimeout(function(){
        mudaEstadoUsuario(false);
        console.log("falso");
    }, 2000);
}

function mudaEstadoUsuario(estado){
    if(!(usuarioAtivo === estado)){
        usuarioAtivo = estado;

        if(usuarioAtivo && !interacaoAtiva){
            mostraControles();
        }else{
            escondeControles();
        }
    }
}