(function(global) {
	global.publication = global.publication || {};
	
	global.publication.data = [];
	global.publication.yearData = {"year2016":[],"year2015":[],"year2014":[],"year2013":[],"year2012":[],"year2011":[],"year2010":[]};
	
	global.publication.Config = {
		URL_SERVERLET_ROOT : '/pub/',
		URL_IMAGES_ROOT : '/img/publication/'	
	};
	
	global.publication.WebServices = new function() {
		this.getData = function(inputParameters, fileName, receiver, tableName, tableCountDivName) {
			data= {

			};

			$.ajax({
				url : publication.WebServices.getFullUrl(fileName),
				dataType : 'json',
				data : data,
				success : function(msg) {
					if (msg.success) {						
						if(msg.data==undefined){
							return false;
						}
						receiver(msg.data,inputParameters,tableName,tableCountDivName);						
					} else {
						publication.View.messageBox(msg.error.msg);
					}
				}
			});
		};
		
		this.getFullUrl = function(actionName) {
			return publication.Config.URL_SERVERLET_ROOT + actionName;
		};
	};
	
	global.publication.View = new function() {
		
		this.onDocumentLoaded = function() {
			publication.View.initPublicationPage();
		};
		
		
		this.createPublicationDiv = function(data,divID,beforeID,upDivID){
			var categoryNode = document.getElementById(upDivID);
			var trNode = document.createElement("tr");
			
			var tdNode1 = document.createElement("td");
			tdNode1.setAttribute("width","120");
			var imgNode = document.createElement("img");
			imgNode.setAttribute("src",data.thumbnail);
			imgNode.setAttribute("height","120");
			imgNode.setAttribute("width","100");
			imgNode.setAttribute("class","img-thumbnail");
			imgNode.setAttribute("data-toggle","tooltip");
			imgNode.setAttribute("title","Abstract: "+data["abstract"]);
			tdNode1.appendChild(imgNode);
			trNode.appendChild(tdNode1);
			
			//content td
			var tdNode2 = document.createElement("td");	
			//title
			var h4Node = document.createElement("strong");
			var titleTextNode = document.createTextNode(data.title);
			h4Node.appendChild(titleTextNode);
			tdNode2.appendChild(h4Node);				
			//author
			var authorNode = document.createElement("p");
			var authorTextNode = document.createTextNode(data.author);
			authorNode.appendChild(authorTextNode);
			tdNode2.appendChild(authorNode);
			//publish
			var publishNode = document.createElement("em");
			var publishTextNode = document.createTextNode(data.publish);
			publishNode.appendChild(publishTextNode);
			tdNode2.appendChild(publishNode);
			//vol
			var volPNode = document.createElement("p");
			var volTextNode = document.createTextNode(data.vol);
			volPNode.appendChild(volTextNode);
			tdNode2.appendChild(volPNode);
			//url
			var urlNode = document.createElement("a");
			urlNode.setAttribute("class","btn btn-large btn-primary");
			urlNode.setAttribute("href",data.url);
			var urlTextNode = document.createTextNode("Read more");
			urlNode.appendChild(urlTextNode);
			tdNode2.appendChild(urlNode);
			
			trNode.appendChild(tdNode2);
			var tableNode = document.getElementById(divID);
			if(tableNode==undefined){
				tableNode = document.createElement("table");
				tableNode.setAttribute("id",divID);
				tableNode.setAttribute("class","table table-hover");
				tableNode.setAttribute("hidden","hidden");
			}
			tableNode.appendChild(trNode);
			
			//add blank line
			var trNode2 = document.createElement("tr");
			var brNode = document.createElement("br");
			trNode2.appendChild(brNode);			
			tableNode.appendChild(trNode2);
			
			//$("#"+divID).insertAfter("#selectedPubTable");
			categoryNode.insertBefore(tableNode,document.getElementById(beforeID));		
		};
		
		this.deleteDivRows = function(tableDivID){
			var div = document.getElementById(tableDivID);
			while(div.length > 0) {
				div.deleteRow(0);
			}
		};
		
		
		/* the 
		<div class="col-lg-12  news-item">
                    <h2>VENUS: A System for Streamlined Graph Computation on a Single PC</h2>
                    <p>Qin Liu, Jiefeng Cheng, Zhenguo Li, John C.S. Lui
                    <p><i>IEEE Transactions on Knowledge and Data Engineering (TKDE 2016)</i></p>

                   <!-- <i class="border-bottom"></i> -->
                </div>
		*/		
		this.createPublication4Div = function(data,section){
			var secNode = document.getElementById(section);
			var divNode = document.createElement("div");
			divNode.className = "col-lg-12  news-item";
			// title
			var titleNode = document.createElement("p");
			
			var titleStrongNode = document.createElement("strong");
			var titleTextNode = document.createTextNode(data.title);
			titleStrongNode.appendChild(titleTextNode); 
			titleNode.appendChild(titleStrongNode);
			//author
			var authorNode = document.createElement("p");
			var authorTextNode = document.createTextNode(data.author);
			authorNode.appendChild(authorTextNode);
			
			// publish 
			var publishNode = document.createElement("p");
			var publishItalicNode = document.createElement("i");
			var publishTextNode = document.createTextNode(data.publish);
			publishItalicNode.appendChild(publishTextNode);
			publishNode.appendChild(publishItalicNode);
			
			divNode.appendChild(titleNode);
			divNode.appendChild(authorNode);
			divNode.appendChild(publishNode);
					
			secNode.appendChild(divNode);
		};
		
		this.showPublications4Div = function(data,inputParameters,tableDivID, tableCountDivID){
			var hiddenDivCount = 0;
			var ViewMoreBtnClickTimes = 0;
			var threshhold = 3;
			publication.View.deleteDivRows(tableDivID);
			
			
			document.getElementById(tableCountDivID).innerHTML = data.length;
			for(var i =0;i<data.length;i++){
				publication.View.createPublication4Div(data[i],tableDivID);				
			}			
		};
		
		this.showPublications = function(data,tableDivID,beforeDivID,upDivID){
			var hiddenDivCount = 0;
			var ViewMoreBtnClickTimes = 0;
			var threshhold = 3;
			for(var i =0;i<data.length;i++){
				
				if(i<threshhold){
					publication.View.createPublication(data[i],tableDivID);
				}
				else if(i%threshhold==0){
					hiddenDivCount++;
					publication.View.createPublicationDiv(data[i],"hiddenDiv"+hiddenDivCount+tableDivID,beforeDivID,upDivID);
				}
				else{
					publication.View.createPublicationDiv(data[i],"hiddenDiv"+hiddenDivCount+tableDivID,beforeDivID,upDivID);
				}
			}
			if(i>threshhold){
				publication.View.createViewMoreBtn(upDivID,beforeDivID);
			}
			$("#ViewMoreBtn"+beforeDivID).click(function(){
				ViewMoreBtnClickTimes++;
				if(ViewMoreBtnClickTimes>hiddenDivCount){
					
				}else{						
					$("#hiddenDiv"+ViewMoreBtnClickTimes+tableDivID).removeAttr("hidden");
				}
			});
		};
		
		this.hideAllYearPublication = function(){
			$("#2016").attr("hidden","hidden");
			$("#2015").attr("hidden","hidden");
			$("#2014").attr("hidden","hidden");
			$("#2013").attr("hidden","hidden");
			$("#2012").attr("hidden","hidden");
		};
		
		this.countSingleYearPublication = function(data, inputParameters, tableCountDivID){
			document.getElementById(tableCountDivID).innerHTML = data.length;
		};
		
		this.countAllYearPublication = function(){
			publication.WebServices.getData("","../pub/pub2016.json", publication.View.countSingleYearPublication,"pub2016count");
			publication.WebServices.getData("","../data/publications/pub2015.json", publication.View.countSingleYearPublication,"pub2015count");
			publication.WebServices.getData("","../data/publications/pub2014.json", publication.View.countSingleYearPublication,"pub2014count");
			publication.WebServices.getData("","../data/publications/pub2013.json", publication.View.countSingleYearPublication,"pub2013count");
			publication.WebServices.getData("","../data/publications/pub2012.json", publication.View.countSingleYearPublication,"pub2012count");
		};
		
		
		this.initPublicationPage = function() {
			publication.View.countAllYearPublication();
			publication.WebServices.getData("","../pub/pub2016.json", publication.View.showPublications4Div,"2016","pub2016count");
			publication.WebServices.getData("","../data/publications/pub2015.json", publication.View.showPublications4Div,"2015","pub2015count");
			publication.WebServices.getData("","../data/publications/pub2014.json", publication.View.showPublications4Div,"2014","pub2014count");
			publication.WebServices.getData("","../data/publications/pub2013.json", publication.View.showPublications4Div,"2013","pub2013count");
			publication.WebServices.getData("","../data/publications/pub2012.json", publication.View.showPublications4Div,"2012","pub2012count");
			
	/*		$("a#selectedPaper").click(function(){
				$("#yearDiv").attr("hidden","hidden");
				$("#selectedPub").removeAttr("hidden");
			});
 			$("#aLL").click(function(){
				$("#yearDiv").attr("hidden","hidden");
				$("#selectedPub").removeAttr("hidden");
			});
			$("#aHC").click(function(){
				$("#yearDiv").attr("hidden","hidden");
				$("#selectedPub").removeAttr("hidden");
			});
			$("#aNG").click(function(){
				$("#yearDiv").attr("hidden","hidden");
				$("#selectedPub").removeAttr("hidden");
			}); */
			
			
			$("#2016").click(function(){
				publication.WebServices.getData("","../pub/pub2016.json", publication.View.showPublications4Div,"2016","pub2016count");
				/*publication.View.hideAllYearPublication();
				$("#2016").removeAttr("hidden");*/
			});
			
			$("#a2015").click(function(){
				publication.WebServices.getData("","../data/publications/pub2015.json", publication.View.showPublications4Div,"2015","pub2015count");
				/*publication.View.hideAllYearPublication();
				$("#2015").removeAttr("hidden");*/
			});
			
			$("#a2014").click(function(){
				publication.WebServices.getData("","../data/publications/pub2014.json", publication.View.showPublications4Div,"2014","pub2014count");
				/*publication.View.hideAllYearPublication();
				$("#2014").removeAttr("hidden");*/
			});
			
			$("#a2013").click(function(){
				publication.WebServices.getData("","../data/publications/pub2013.json", publication.View.showPublications4Div,"2013","pub2013count");
				/*publication.View.hideAllYearPublication();
				$("#2013").removeAttr("hidden");*/
			});
			
			$("#a2012").click(function(){
				publication.WebServices.getData("","../data/publications/pub2012.json", publication.View.showPublications4Div,"2012","pub2012count");
				/*publication.View.hideAllYearPublication();
				$("#2012").removeAttr("hidden");*/
			});
			
		};
	};
	
	$(document).ready(function() {
		publication.View.onDocumentLoaded();
	});

})(this);