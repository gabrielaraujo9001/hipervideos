<?php
	/* Definindo o charset padrão do servidor PHP */
	ini_set( 'default_charset', 'utf-8' );
	header ('Content-type: text/html; charset=UTF-8');
?>
<!--
	** Projeto: Oficinas de produção de hipervídeos interativos **
	** Orientadores: Windson Viana, Melo Jr, Ismael Furtado **
	** Desenvolvedor web: Gabriel Rodrigues **
	** Designer: Pedro Ítalo **
-->
<?php
	/* Importando arquivos */
	include('config.php');
	$file = file_get_contents($hipervideos_URL."/".$hipervideos_indice[0]."/"."info.json"); //Variável definida em config.php

	/* Decodificando JSON */
	$json = json_decode($file, true);
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<title><?php echo $json['metadados']['titulo']; ?></title>
	<link rel="stylesheet" type="text/css" href ="style.css">
	<link rel="stylesheet" type="text/css" href ="css/fonts.css">
	<link rel="icon" href="favicon.ico">
	<script src="js/jquery-1.12.3.min.js"></script>
	<script src="js/popcorn-complete.js"></script>
	<script src="js/functions.js"></script>
	<script type="text/javascript">
		var chamadaJSON = <?php echo $file ?>;
		var previewsURL = "<?php echo $hipervideos_URL."/".$hipervideos_indice[0]."/images/previews/"; ?>";
	</script>
</head>

<body>
	<div id="content-box">
		<!-- Para o caso de o dispositivo estar em "portrait" -->
		<div id="warning-message">
			<p>Esta aplicação só pode ser visualizada no modo paisagem (landscape).<br></p>
			<img src="images/warning-message.png"/>
			<p><a href="http://www.freepik.com/free-photos-vectors/background">Background vector designed by Freepik</a></p>
			<p><a rel="nofollow" href="http://www.vecteezy.com">Free Vectors via vecteezy.com</a></p>
		</div>

		<!-- Barra de título -->
		<header id="video-info">
			<img id="icone-categoria-video" src="images/icons/cerebro.png"/>
			<svg id="foto-perfil"><use xlink:href="#profile"></use></svg>
			<h1 id="titulo-video"><?php echo $json['metadados']['titulo']; ?></h1>
			<h3 id="autor-video">Autor: <?php echo $json['metadados']['autor'];?></h3>
		</header>

		<!-- Vídeo e funcionalidades -->
		<div id="area-player">
		<div id="video-container">
			<!-- Adicionando o vídeo -->
			<div id="video-player">
				<video id="video" poster="<?php echo $hipervideos_URL.'/'.$hipervideos_indice[0].'/images/previews/poster.png'; ?>" webkit-playsinline>
        			<source src="<?php echo $hipervideos_URL.'/'.$hipervideos_indice[0].'/'.$json['metadados']['arquivo'].'.mp4'; ?>" type="video/mp4">
        			<source src="<?php echo $hipervideos_URL.'/'.$hipervideos_indice[0].'/'.$json['metadados']['arquivo'].'.ogv'; ?>" type="video/ogg">
        		</video>
        		<!-- Botão de play -->
        		<img id="play" src="images/icons/play.png"/>
        		<!-- Bufferizando -->
        		<img src="images/icons/buffering.svg" id="buffering"/>
        	</div>
        	<div id="video-drawboard"></div>
        	<audio id="audio"></audio>

        	<!-- Fundo da parte de baixo -->
        	<div id="fundo-controles"></div>

        	<!-- Barra de progresso -->
        	<div id="barra-progresso-container">
        		<div id="barra-progresso-padding"></div>
				<div id="carregamento"></div>
				<div id="progresso-hover"></div>
				<div id="progresso"></div>
				<div id="marcadores"><ul></ul></div>
			</div>

        	<!-- Barra de controles do Player -->
        	<div id="container-controles">
				<!-- Previews do vídeo -->
				<div id="previews"><span></span></div>
				<!-- Controles do player -->
				<div id="controles">
					<div id="play-pause"><img src="images/icons/play32.png"/></div>
					<div id="volume">
						<div id="volume-controller"><div id="volume-handle-background"><div id="volume-handle"></div></div></div>
						<img src="images/icons/volume32.png"/>
					</div>
				 	<div id="tempo">00:00 / 00:00</div>
				 	<h3 id="clip-atual">Default</h3>
				 	
					<div id="tela-cheia"><img src="images/icons/telacheia32.png"/></div>
					<div id="pontos">Pontos: 0</div>
				</div>
			</div>
		</div>
		</div>

		<!-- Tela de conclusão do vídeo -->
		<div class="tela-de-conclusao">
			<h1>Parabéns!</h1>
			<h3>Você concluiu o hipervídeo <span class="titulo-final"></span>!<br>
				Você acertou <span class="numero-de-perguntas"></span> perguntas <span class="porcentagem-de-respostas"></span> e obteve 
				<span class="pontuacao"></span>.
			</h3>
			<h4></h4>
		</div>
	</div>
</body>
<script src="projeto.js"></script>
</html>