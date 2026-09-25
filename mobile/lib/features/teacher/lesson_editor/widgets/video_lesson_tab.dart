import 'package:flutter/material.dart';

/// ============================================================
/// VideoLessonTab — Aba de cadastro de Videoaula
/// ============================================================
/// Formulário para o professor cadastrar:
/// - Título da aula
/// - URL do vídeo (YouTube/Vimeo/Upload)
/// - Texto explicativo (Rich Text simplificado)
/// - Tempo mínimo de visualização
class VideoLessonTab extends StatefulWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController titleController;
  final TextEditingController videoUrlController;
  final TextEditingController contentController;
  final TextEditingController minWatchTimeController;
  final String selectedProvider;
  final ValueChanged<String?> onProviderChanged;

  const VideoLessonTab({
    super.key,
    required this.formKey,
    required this.titleController,
    required this.videoUrlController,
    required this.contentController,
    required this.minWatchTimeController,
    required this.selectedProvider,
    required this.onProviderChanged,
  });

  @override
  State<VideoLessonTab> createState() => _VideoLessonTabState();
}

class _VideoLessonTabState extends State<VideoLessonTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);

    return Form(
      key: widget.formKey,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Título da Aula ──
          _buildSectionLabel('Título da Aula', Icons.school_rounded),
          const SizedBox(height: 8),
          TextFormField(
            controller: widget.titleController,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurface,
            ),
            decoration: const InputDecoration(
              hintText: 'Ex: Equações do 1º Grau',
              prefixIcon: Icon(Icons.title_rounded),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'O título é obrigatório';
              }
              return null;
            },
          ),

          const SizedBox(height: 28),

          // ── Provedor de Vídeo ──
          _buildSectionLabel('Provedor de Vídeo', Icons.videocam_rounded),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E48),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2D2D5E)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: widget.selectedProvider,
                isExpanded: true,
                dropdownColor: const Color(0xFF1A1A3E),
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
                icon: Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: theme.colorScheme.primary,
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'YOUTUBE',
                    child: Row(
                      children: [
                        Icon(Icons.play_circle_fill,
                            color: Color(0xFFFF0000), size: 20),
                        SizedBox(width: 10),
                        Text('YouTube'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'VIMEO',
                    child: Row(
                      children: [
                        Icon(Icons.play_circle_outline,
                            color: Color(0xFF1AB7EA), size: 20),
                        SizedBox(width: 10),
                        Text('Vimeo'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'UPLOAD',
                    child: Row(
                      children: [
                        Icon(Icons.cloud_upload_rounded,
                            color: Color(0xFF8B5CF6), size: 20),
                        SizedBox(width: 10),
                        Text('Upload Direto'),
                      ],
                    ),
                  ),
                ],
                onChanged: widget.onProviderChanged,
              ),
            ),
          ),

          const SizedBox(height: 20),

          // ── URL do Vídeo ──
          _buildSectionLabel('URL do Vídeo', Icons.link_rounded),
          const SizedBox(height: 8),
          TextFormField(
            controller: widget.videoUrlController,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurface,
            ),
            decoration: InputDecoration(
              hintText: widget.selectedProvider == 'UPLOAD'
                  ? 'O arquivo será selecionado abaixo'
                  : 'https://www.youtube.com/watch?v=...',
              prefixIcon: const Icon(Icons.link_rounded),
              suffixIcon: widget.selectedProvider == 'UPLOAD'
                  ? IconButton(
                      icon: Icon(Icons.upload_file_rounded,
                          color: theme.colorScheme.primary),
                      onPressed: () {
                        // TODO: Implementar file picker
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('File picker será implementado na integração'),
                            backgroundColor: theme.colorScheme.primary,
                          ),
                        );
                      },
                    )
                  : null,
            ),
            validator: (value) {
              if (widget.selectedProvider != 'UPLOAD' &&
                  (value == null || value.trim().isEmpty)) {
                return 'A URL do vídeo é obrigatória';
              }
              return null;
            },
          ),

          const SizedBox(height: 28),

          // ── Tempo Mínimo de Visualização ──
          _buildSectionLabel(
              'Tempo Mínimo (segundos)', Icons.timer_rounded),
          const SizedBox(height: 8),
          TextFormField(
            controller: widget.minWatchTimeController,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurface,
            ),
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: '300 (5 minutos)',
              prefixIcon: Icon(Icons.hourglass_bottom_rounded),
            ),
            validator: (value) {
              if (value != null && value.isNotEmpty) {
                final parsed = int.tryParse(value);
                if (parsed == null || parsed < 0) {
                  return 'Insira um número válido';
                }
              }
              return null;
            },
          ),

          const SizedBox(height: 28),

          // ── Conteúdo de Apoio (Rich Text) ──
          _buildSectionLabel(
              'Texto de Apoio', Icons.description_rounded),
          const SizedBox(height: 8),

          // Toolbar simplificada
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E48),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              border: Border.all(color: const Color(0xFF2D2D5E)),
            ),
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              children: [
                _buildToolbarButton(Icons.format_bold_rounded, 'Negrito'),
                _buildToolbarButton(
                    Icons.format_italic_rounded, 'Itálico'),
                _buildToolbarButton(
                    Icons.format_underlined_rounded, 'Sublinhado'),
                const VerticalDivider(
                    width: 16, color: Color(0xFF2D2D5E)),
                _buildToolbarButton(
                    Icons.format_list_bulleted_rounded, 'Lista'),
                _buildToolbarButton(Icons.code_rounded, 'Código'),
                _buildToolbarButton(Icons.image_rounded, 'Imagem'),
              ],
            ),
          ),

          // Área de texto
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E48),
              borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(12)),
              border: const Border(
                left: BorderSide(color: Color(0xFF2D2D5E)),
                right: BorderSide(color: Color(0xFF2D2D5E)),
                bottom: BorderSide(color: Color(0xFF2D2D5E)),
              ),
            ),
            child: TextFormField(
              controller: widget.contentController,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
                height: 1.8,
              ),
              maxLines: 10,
              decoration: const InputDecoration(
                hintText:
                    'Escreva o conteúdo explicativo da aula aqui...\n\nUse a toolbar acima para formatar o texto.',
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(16),
              ),
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String label, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF8B5CF6)),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: Color(0xFFF1F5F9),
            letterSpacing: 0.3,
          ),
        ),
      ],
    );
  }

  Widget _buildToolbarButton(IconData icon, String tooltip) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        borderRadius: BorderRadius.circular(6),
        onTap: () {
          // TODO: Implementar formatação rich text
        },
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 18, color: const Color(0xFF94A3B8)),
        ),
      ),
    );
  }
}
