import 'package:flutter/material.dart';
import '../widgets/video_lesson_tab.dart';
import '../widgets/quiz_editor_tab.dart';

/// ============================================================
/// LessonEditorScreen — Painel do Professor
/// ============================================================
/// Tela principal com TabBar contendo 2 abas:
/// - Aba "Videoaula": cadastro de vídeo + texto de apoio
/// - Aba "Quiz": cadastro de perguntas do quiz vinculado
///
/// Design: Dark Mode com acentos neon roxo, bordas sutis,
/// AppBar com gradiente e botão de salvar com glow.
class LessonEditorScreen extends StatefulWidget {
  final String? lessonId; // null = nova aula, string = edição

  const LessonEditorScreen({super.key, this.lessonId});

  @override
  State<LessonEditorScreen> createState() => _LessonEditorScreenState();
}

class _LessonEditorScreenState extends State<LessonEditorScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // ── Form Controllers — Videoaula ──
  final _videoFormKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _videoUrlController = TextEditingController();
  final _contentController = TextEditingController();
  final _minWatchTimeController = TextEditingController(text: '300');
  String _selectedProvider = 'YOUTUBE';

  // ── Form State — Quiz ──
  bool _isTimerEnabled = false;
  final _timeLimitController = TextEditingController(text: '600');
  List<QuizQuestionData> _questions = [];

  // ── UI State ──
  bool _isSaving = false;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Detectar mudanças para habilitar botão salvar
    _titleController.addListener(_markChanged);
    _videoUrlController.addListener(_markChanged);
    _contentController.addListener(_markChanged);
  }

  void _markChanged() {
    if (!_hasChanges) {
      setState(() => _hasChanges = true);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _videoUrlController.dispose();
    _contentController.dispose();
    _minWatchTimeController.dispose();
    _timeLimitController.dispose();
    for (final q in _questions) {
      q.dispose();
    }
    super.dispose();
  }

  void _addQuestion() {
    setState(() {
      _questions.add(QuizQuestionData());
      _hasChanges = true;
    });
  }

  void _removeQuestion(int index) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A3E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Remover Pergunta',
          style: TextStyle(color: Color(0xFFF1F5F9)),
        ),
        content: Text(
          'Tem certeza que deseja remover a pergunta ${index + 1}?',
          style: const TextStyle(color: Color(0xFF94A3B8)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar',
                style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _questions[index].dispose();
                _questions.removeAt(index);
                _hasChanges = true;
              });
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveLesson() async {
    // Validar aba de vídeo
    if (!_videoFormKey.currentState!.validate()) {
      _tabController.animateTo(0);
      return;
    }

    // Validar perguntas
    if (_questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Adicione pelo menos uma pergunta ao quiz'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      _tabController.animateTo(1);
      return;
    }

    setState(() => _isSaving = true);

    // Simular salvamento (substituir pela chamada à API)
    await Future.delayed(const Duration(seconds: 2));

    // Montar payload
    final payload = {
      'title': _titleController.text,
      'videoUrl': _videoUrlController.text,
      'videoProvider': _selectedProvider,
      'richTextContent': _contentController.text,
      'minWatchTimeSec': int.tryParse(_minWatchTimeController.text) ?? 300,
      'quiz': {
        'isTimerEnabled': _isTimerEnabled,
        'timeLimitSec': _isTimerEnabled
            ? int.tryParse(_timeLimitController.text) ?? 600
            : null,
        'questions': _questions.map((q) {
          return {
            'text': q.textController.text,
            'options': q.optionControllers.map((c) => c.text).toList(),
            'correctIndex': q.correctIndex,
          };
        }).toList(),
      },
    };

    debugPrint('Payload: $payload');

    setState(() {
      _isSaving = false;
      _hasChanges = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_rounded,
                  color: Colors.white, size: 18),
              SizedBox(width: 8),
              Text('Aula salva com sucesso!'),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // ── TabBar ──
          _buildTabBar(),

          // ── Conteúdo das Abas ──
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Aba 1: Videoaula
                VideoLessonTab(
                  formKey: _videoFormKey,
                  titleController: _titleController,
                  videoUrlController: _videoUrlController,
                  contentController: _contentController,
                  minWatchTimeController: _minWatchTimeController,
                  selectedProvider: _selectedProvider,
                  onProviderChanged: (value) {
                    setState(() {
                      _selectedProvider = value ?? 'YOUTUBE';
                      _hasChanges = true;
                    });
                  },
                ),

                // Aba 2: Quiz
                QuizEditorTab(
                  isTimerEnabled: _isTimerEnabled,
                  onTimerToggle: (value) {
                    setState(() {
                      _isTimerEnabled = value;
                      _hasChanges = true;
                    });
                  },
                  timeLimitController: _timeLimitController,
                  questions: _questions,
                  onAddQuestion: _addQuestion,
                  onRemoveQuestion: _removeQuestion,
                ),
              ],
            ),
          ),
        ],
      ),

      // ── Botão Salvar ──
      bottomNavigationBar: _buildSaveBar(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF0A0A1A),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
        onPressed: () {
          if (_hasChanges) {
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                backgroundColor: const Color(0xFF1A1A3E),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                title: const Text('Descartar alterações?',
                    style: TextStyle(color: Color(0xFFF1F5F9))),
                content: const Text(
                  'Você tem alterações não salvas. Deseja sair mesmo assim?',
                  style: TextStyle(color: Color(0xFF94A3B8)),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Continuar editando',
                        style: TextStyle(color: Color(0xFF8B5CF6))),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                    ),
                    child: const Text('Descartar'),
                  ),
                ],
              ),
            );
          } else {
            Navigator.pop(context);
          }
        },
      ),
      title: Column(
        children: [
          Text(
            widget.lessonId != null ? 'Editar Aula' : 'Nova Aula',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 17,
              color: Color(0xFFF1F5F9),
            ),
          ),
          if (widget.lessonId != null)
            Text(
              'ID: ${widget.lessonId}',
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF64748B),
              ),
            ),
        ],
      ),
      centerTitle: true,
      actions: [
        // Status de alterações
        if (_hasChanges)
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFBBF24).withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.edit_rounded, size: 12, color: Color(0xFFFBBF24)),
                SizedBox(width: 4),
                Text(
                  'Editado',
                  style: TextStyle(
                    color: Color(0xFFFBBF24),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0A0A1A),
        border: Border(
          bottom: BorderSide(color: Color(0xFF2D2D5E), width: 1),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        tabs: [
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.videocam_rounded, size: 18,
                    color: _tabController.index == 0
                        ? const Color(0xFF8B5CF6)
                        : const Color(0xFF94A3B8)),
                const SizedBox(width: 8),
                const Text('Videoaula'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.quiz_rounded, size: 18,
                    color: _tabController.index == 1
                        ? const Color(0xFF8B5CF6)
                        : const Color(0xFF94A3B8)),
                const SizedBox(width: 8),
                const Text('Quiz'),
              ],
            ),
          ),
        ],
        indicatorColor: const Color(0xFF8B5CF6),
        indicatorWeight: 3,
        labelColor: const Color(0xFF8B5CF6),
        unselectedLabelColor: const Color(0xFF94A3B8),
        onTap: (_) => setState(() {}),
      ),
    );
  }

  Widget _buildSaveBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111128),
        border: const Border(
          top: BorderSide(color: Color(0xFF2D2D5E)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Info
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_questions.length} pergunta${_questions.length != 1 ? 's' : ''}',
                    style: const TextStyle(
                      color: Color(0xFFF1F5F9),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    _isTimerEnabled
                        ? 'Timer: ${_timeLimitController.text}s'
                        : 'Sem temporizador',
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            // Botão Salvar
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              decoration: BoxDecoration(
                gradient: _hasChanges
                    ? const LinearGradient(
                        colors: [Color(0xFF8B5CF6), Color(0xFF3B82F6)],
                      )
                    : null,
                color: _hasChanges ? null : const Color(0xFF2D2D5E),
                borderRadius: BorderRadius.circular(12),
                boxShadow: _hasChanges
                    ? [
                        BoxShadow(
                          color: const Color(0xFF8B5CF6).withOpacity(0.4),
                          blurRadius: 16,
                          spreadRadius: 0,
                        ),
                      ]
                    : null,
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: _hasChanges && !_isSaving ? _saveLesson : null,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 28, vertical: 14),
                    child: _isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.save_rounded,
                                size: 18,
                                color: _hasChanges
                                    ? Colors.white
                                    : const Color(0xFF64748B),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Salvar Aula',
                                style: TextStyle(
                                  color: _hasChanges
                                      ? Colors.white
                                      : const Color(0xFF64748B),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
