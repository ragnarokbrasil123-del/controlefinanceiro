              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Botão Câmera Direta (Como Label Nativa) */}
                <label className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-indigo-500/30">
                    <Camera className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="font-bold text-white text-sm">Tirar Foto</span>
                  <span className="text-xs text-neutral-500 mt-1 text-center">Câmera do Celular</span>
                  
                  {/* O input fica escondido DENTRO do botão */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                </label>

                {/* Botão Arquivos (Como Label Nativa) */}
                <label className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-purple-500/30">
                    <UploadCloud className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="font-bold text-white text-sm">Enviar Arquivo</span>
                  <span className="text-xs text-neutral-500 mt-1 text-center">Galeria ou Arquivos</span>
                  
                  {/* O input fica escondido DENTRO do botão */}
                  <input 
                    type="file" 
                    accept="image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* VOCÊ PODE DELETAR AQUELES DOIS INPUTS INVISÍVEIS QUE FICAVAM LÁ NO FINAL DO CÓDIGO! */}
